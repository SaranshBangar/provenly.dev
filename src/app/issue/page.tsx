import { redirect } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { getSessionContext } from "@/lib/session";
import { getDb } from "@/db";
import { event, template } from "@/db/schema";
import { initialsOf } from "@/lib/util";
import { IssueClient } from "@/components/IssueClient";

export const dynamic = "force-dynamic";

export default async function IssuePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const db = getDb();
  const [events, templates] = await Promise.all([
    db.select({ id: event.id, name: event.name }).from(event).where(eq(event.companyId, ctx.org.id)).orderBy(asc(event.name)),
    db.select({ id: template.id, name: template.name, type: template.type, data: template.data }).from(template).where(eq(template.companyId, ctx.org.id)).orderBy(desc(template.createdAt)),
  ]);
  return (
    <IssueClient
      credits={ctx.wallet.credits}
      initials={initialsOf(ctx.org.name)}
      events={events}
      templates={templates}
    />
  );
}
