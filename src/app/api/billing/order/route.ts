import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { getSessionAndCompany } from "@/lib/session";
import { MIN_TOPUP_INR, isCashfreeConfigured, createCashfreeOrder, cashfreeEnv } from "@/lib/cashfree";

export const dynamic = "force-dynamic";

function appUrl(req: Request): string {
  const { env } = getCloudflareContext();
  return (env.NEXT_PUBLIC_APP_URL as string) || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const { user, company } = await getSessionAndCompany();
  if (!user || !company) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { amount?: number } | null;
  const amount = Math.floor(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_INR) {
    return NextResponse.json({ error: `Minimum top-up is ₹${MIN_TOPUP_INR}.` }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const orderId = "PROV-" + id;

  await db.insert(payment).values({
    id,
    companyId: company.id,
    cfOrderId: orderId,
    amountInr: amount,
    credits: amount, // ₹1 = 1 credit
    status: "created",
    createdAt: new Date(),
  });

  const base = appUrl(req);

  if (!isCashfreeConfigured()) {
    // MOCK mode, no live keys. Simulate payment via a local confirm route.
    return NextResponse.json({ mode: "mock", mockUrl: `/api/billing/mock?order_id=${encodeURIComponent(orderId)}` });
  }

  try {
    const { paymentSessionId } = await createCashfreeOrder({
      orderId,
      amountInr: amount,
      customerId: company.id,
      customerEmail: user.email,
      returnUrl: `${base}/billing?order_id={order_id}`,
      notifyUrl: `${base}/api/billing/webhook`,
    });
    return NextResponse.json({
      mode: "cashfree",
      paymentSessionId,
      orderId,
      cashfreeMode: cashfreeEnv().CASHFREE_ENV === "production" ? "production" : "sandbox",
    });
  } catch (e) {
    await db.update(payment).set({ status: "failed" }).where(eq(payment.id, id));
    console.error("cashfree order failed", e);
    return NextResponse.json({ error: "Payment provider error. Try again." }, { status: 502 });
  }
}
