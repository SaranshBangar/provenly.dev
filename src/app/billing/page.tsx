import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { isCashfreeConfigured } from "@/lib/cashfree";
import { BillingClient } from "@/components/BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const sp = await searchParams;
  const status = sp.success ? "success" : sp.error ? "error" : null;

  return (
    <BillingClient
      credits={ctx.wallet.credits}
      initials={initialsOf(ctx.org.name)}
      plan={ctx.wallet.plan}
      configured={isCashfreeConfigured()}
      status={status}
    />
  );
}
