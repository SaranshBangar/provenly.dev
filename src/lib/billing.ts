import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { addCredits } from "@/lib/credits";
import { MIN_TOPUP_INR } from "@/lib/cashfree";

/**
 * Credit an order exactly once. Idempotent: only a payment still in the
 * "created" state is settled. Re-validates the ₹50 minimum server-side.
 */
export async function settlePayment(orderId: string, paidAmount?: number): Promise<{ ok: boolean; reason?: string }> {
  const db = getDb();
  const row = await db.query.payment.findFirst({ where: eq(payment.cfOrderId, orderId) });
  if (!row) return { ok: false, reason: "order not found" };
  if (row.status === "paid") return { ok: true }; // already credited
  if (row.status === "failed") return { ok: false, reason: "order failed" };

  if (row.amountInr < MIN_TOPUP_INR) {
    await db.update(payment).set({ status: "failed" }).where(eq(payment.id, row.id));
    return { ok: false, reason: "below minimum" };
  }
  if (typeof paidAmount === "number" && Math.floor(paidAmount) !== row.amountInr) {
    return { ok: false, reason: "amount mismatch" };
  }

  await addCredits(row.companyId, row.credits, true);
  await db.update(payment).set({ status: "paid" }).where(eq(payment.id, row.id));
  return { ok: true };
}
