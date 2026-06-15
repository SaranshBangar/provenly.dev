import { redirect } from "next/navigation";
import { getSessionAndCompany } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { PreviewClient } from "@/components/PreviewClient";

export const dynamic = "force-dynamic";

export default async function PreviewPage() {
  const { user, company } = await getSessionAndCompany();
  if (!user || !company) redirect("/login");
  return <PreviewClient credits={company.credits} initials={initialsOf(company.name)} />;
}
