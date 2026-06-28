import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { getSessionContext } from "@/lib/session";
import { getDb } from "@/db";
import { event } from "@/db/schema";
import { initialsOf } from "@/lib/util";
import { UploadClient } from "@/components/UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const db = getDb();
  const events = await db
    .select({ id: event.id, name: event.name })
    .from(event)
    .where(eq(event.companyId, ctx.org.id))
    .orderBy(asc(event.name));
  return (
    <UploadClient
      credits={ctx.wallet.credits}
      initials={initialsOf(ctx.org.name)}
      orgName={ctx.org.name}
      events={events}
    />
  );
}
