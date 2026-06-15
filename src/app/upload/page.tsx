import { redirect } from "next/navigation";
import { getSessionAndCompany } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { UploadClient } from "@/components/UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const { user, company } = await getSessionAndCompany();
  if (!user || !company) redirect("/login");
  return <UploadClient credits={company.credits} initials={initialsOf(company.name)} />;
}
