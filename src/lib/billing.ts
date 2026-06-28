import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { addCredits } from "@/lib/credits";
import { MIN_TOPUP_INR } from "@/lib/cashfree";

/**
 * Credit an order exactly once. Idempotent even under concurrent webhook
 * deliveries: a single conditional UPDATE atomically claims the row by
 * flipping created->paid, and credits are only added if THIS call won the
 * claim. Re-validates the ₹50 minimum server-side.
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

  // Atomic claim: only one concurrent caller flips created->paid (changes=1).
  // Losers see changes=0 and must NOT credit again.
  const { env } = getCloudflareContext();
  const claim = await env.DB.prepare(
    "UPDATE payment SET status = 'paid' WHERE id = ?1 AND status = 'created'",
  )
    .bind(row.id)
    .run();
  if ((claim.meta.changes ?? 0) === 0) return { ok: true }; // already claimed elsewhere

  try {
    await addCredits(row.walletId, row.credits, true);
  } catch (e) {
    // Crediting failed after claiming, release the claim so a retry can settle.
    await db.update(payment).set({ status: "created" }).where(eq(payment.id, row.id));
    throw e;
  }
  return { ok: true };
}
