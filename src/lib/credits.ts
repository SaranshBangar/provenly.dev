import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Atomically remove `n` credits from a wallet. Returns true on success,
 * false if the wallet didn't have enough (no change made).
 */
export async function deductCredits(walletId: string, n: number): Promise<boolean> {
  if (n <= 0) return true;
  const { env } = getCloudflareContext();
  const res = await env.DB.prepare(
    "UPDATE wallet SET credits = credits - ?1 WHERE id = ?2 AND credits >= ?1",
  )
    .bind(n, walletId)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/**
 * Add `n` credits and (optionally) upgrade the plan to "pro".
 */
export async function addCredits(walletId: string, n: number, makePro = true): Promise<void> {
  if (n <= 0) return;
  const { env } = getCloudflareContext();
  await env.DB.prepare(
    `UPDATE wallet SET credits = credits + ?1${makePro ? ", plan = 'pro'" : ""} WHERE id = ?2`,
  )
    .bind(n, walletId)
    .run();
}
