import { headers, cookies } from "next/headers";
import { eq, asc } from "drizzle-orm";
import { getAuth } from "./auth";
import { getDb } from "@/db";
import { company, wallet, type Company, type Wallet } from "@/db/schema";

export const ORG_COOKIE = "provenly_org";

export async function getSession() {
  const auth = getAuth();
  return auth.api.getSession({ headers: await headers() });
}

/** Find (or lazily create) the shared credit wallet for a user. */
async function ensureWallet(userId: string): Promise<Wallet> {
  const db = getDb();
  let w = await db.query.wallet.findFirst({ where: eq(wallet.userId, userId) });
  if (!w) {
    await db.insert(wallet).values({
      id: crypto.randomUUID(),
      userId,
      plan: "free",
      credits: 5,
      createdAt: new Date(),
    });
    w = await db.query.wallet.findFirst({ where: eq(wallet.userId, userId) });
  }
  return w!;
}

/** Load a user's organizations, creating a default one if they have none. */
async function ensureOrgs(userId: string, name: string): Promise<Company[]> {
  const db = getDb();
  let orgs = await db.query.company.findMany({
    where: eq(company.userId, userId),
    orderBy: asc(company.createdAt),
  });
  if (orgs.length === 0) {
    await db.insert(company).values({
      id: crypto.randomUUID(),
      userId,
      name: name || "My Organization",
      createdAt: new Date(),
    });
    orgs = await db.query.company.findMany({
      where: eq(company.userId, userId),
      orderBy: asc(company.createdAt),
    });
  }
  return orgs;
}

export type SessionContext = {
  user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
  wallet: Wallet;
  orgs: Company[];
  org: Company;
};

/**
 * Resolve the signed-in user along with their shared wallet, their list of
 * organizations, and the currently-selected organization (from the
 * `provenly_org` cookie, falling back to the first org).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const w = await ensureWallet(session.user.id);
  const orgs = await ensureOrgs(session.user.id, session.user.name);

  const cookieId = (await cookies()).get(ORG_COOKIE)?.value;
  const org = orgs.find((o) => o.id === cookieId) ?? orgs[0];

  return { user: session.user, wallet: w, orgs, org };
}
