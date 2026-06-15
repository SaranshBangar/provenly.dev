import { NextResponse } from "next/server";
import { verifyCashfreeSignature, isCashfreeConfigured } from "@/lib/cashfree";
import { settlePayment } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";

  // Verify the signature when Cashfree is configured.
  if (isCashfreeConfigured()) {
    const valid = await verifyCashfreeSignature(raw, signature, timestamp);
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: { order?: { order_id?: string; order_amount?: number }; payment?: { payment_status?: string } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const amount = payload.data?.order?.order_amount;
  const ok = payload.type === "PAYMENT_SUCCESS_WEBHOOK" || payload.data?.payment?.payment_status === "SUCCESS";

  if (ok && orderId) {
    const result = await settlePayment(orderId, typeof amount === "number" ? amount : undefined);
    if (!result.ok) console.warn("webhook settle skipped:", result.reason, orderId);
  }

  // Always 200 so Cashfree doesn't retry endlessly on non-success events.
  return NextResponse.json({ received: true });
}
