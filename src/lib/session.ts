import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getAuth } from "./auth";
import { getDb } from "@/db";
import { company, type Company } from "@/db/schema";

export async function getSession() {
  const auth = getAuth();
  return auth.api.getSession({ headers: await headers() });
}

export async function getCompanyForUser(userId: string): Promise<Company | undefined> {
  const db = getDb();
  return db.query.company.findFirst({ where: eq(company.userId, userId) });
}

/**
 * Resolve the current user and their company, creating the company lazily if a
 * prior account somehow lacks one (e.g. first social sign-in).
 */
export async function getSessionAndCompany() {
  const session = await getSession();
  if (!session?.user) return { user: null, company: null };

  let comp = await getCompanyForUser(session.user.id);
  if (!comp) {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(company).values({
      id,
      userId: session.user.id,
      name: session.user.name || "My Organization",
      plan: "free",
      credits: 5,
      createdAt: new Date(),
    });
    comp = await getCompanyForUser(session.user.id);
  }
  return { user: session.user, company: comp ?? null };
}
