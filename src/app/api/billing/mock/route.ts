import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { settlePayment } from "@/lib/billing";
import { isCashfreeConfigured } from "@/lib/cashfree";

export const dynamic = "force-dynamic";

/**
 * MOCK payment confirmation, only available when Cashfree is NOT configured.
 * Simulates a successful payment so the full credit flow is testable locally.
 */
export async function GET(req: Request) {
  if (isCashfreeConfigured()) {
    return NextResponse.json({ error: "Mock disabled when Cashfree is configured" }, { status: 403 });
  }
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.redirect(new URL("/login", req.url));

  const orderId = new URL(req.url).searchParams.get("order_id");
  if (!orderId) return NextResponse.redirect(new URL("/billing?error=1", req.url));

  const result = await settlePayment(orderId);
  return NextResponse.redirect(new URL(`/billing?${result.ok ? "success=1" : "error=1"}`, req.url));
}
