import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, schema } from "@/db";
import { dash } from "@better-auth/infra";

/**
 * Better Auth instance. Built per-request because Cloudflare bindings/secrets
 * are only available inside the request context.
 */
export function getAuth() {
  const { env } = getCloudflareContext();
  const db = getDb();

  const baseURL = env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const hasGoogle = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders: hasGoogle
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24,
    },
    databaseHooks: {
      user: {
        create: {
          // Every account owns exactly one company. Seed it with 5 free credits.
          after: async (newUser) => {
            try {
              const cdb = getDb();
              const existing = await cdb.query.company.findFirst({
                where: (c, { eq }) => eq(c.userId, newUser.id),
              });
              if (!existing) {
                await cdb.insert(schema.company).values({
                  id: crypto.randomUUID(),
                  userId: newUser.id,
                  name: newUser.name || "My Organization",
                  plan: "free",
                  credits: 5,
                  createdAt: new Date(),
                });
              }
            } catch (e) {
              console.error("company seed failed", e);
            }
          },
        },
      },
    },
    plugins: [dash()],
  });
}

export type Auth = ReturnType<typeof getAuth>;
