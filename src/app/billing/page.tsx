import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getSessionContext } from "@/lib/session";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { initialsOf } from "@/lib/util";
import { isCashfreeConfigured } from "@/lib/cashfree";
import { BillingClient, type TopUp } from "@/components/BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const sp = await searchParams;
  const status = sp.success ? "success" : sp.error ? "error" : null;

  const db = getDb();
  const rows = await db
    .select({ id: payment.id, amountInr: payment.amountInr, credits: payment.credits, status: payment.status, createdAt: payment.createdAt })
    .from(payment)
    .where(eq(payment.walletId, ctx.wallet.id))
    .orderBy(desc(payment.createdAt));
  const topUps: TopUp[] = rows.map((r) => ({
    id: r.id,
    amountInr: r.amountInr,
    credits: r.credits,
    status: r.status,
    date: new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  }));

  return (
    <BillingClient
      credits={ctx.wallet.credits}
      initials={initialsOf(ctx.org.name)}
      plan={ctx.wallet.plan}
      configured={isCashfreeConfigured()}
      status={status}
      topUps={topUps}
    />
  );
}
