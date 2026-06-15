import { redirect } from "next/navigation";
import { getSessionAndCompany } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { isCashfreeConfigured } from "@/lib/cashfree";
import { BillingClient } from "@/components/BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, company } = await getSessionAndCompany();
  if (!user || !company) redirect("/login");
  const sp = await searchParams;
  const status = sp.success ? "success" : sp.error ? "error" : null;

  return (
    <BillingClient
      credits={company.credits}
      initials={initialsOf(company.name)}
      plan={company.plan}
      configured={isCashfreeConfigured()}
      status={status}
    />
  );
}
