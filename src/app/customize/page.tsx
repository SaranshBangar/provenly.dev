import { redirect } from "next/navigation";
import { getSessionAndCompany } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { CustomizerClient } from "@/components/CustomizerClient";

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const { user, company } = await getSessionAndCompany();
  if (!user || !company) redirect("/login");
  return <CustomizerClient credits={company.credits} initials={initialsOf(company.name)} />;
}
