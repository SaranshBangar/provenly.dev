import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { initialsOf } from "@/lib/util";
import { PreviewClient } from "@/components/PreviewClient";

export const dynamic = "force-dynamic";

export default async function PreviewPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  return <PreviewClient credits={ctx.wallet.credits} initials={initialsOf(ctx.org.name)} />;
}
