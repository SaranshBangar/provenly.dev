import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/* ============================================================
   Better Auth tables (canonical drizzle/sqlite shape)
   ============================================================ */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/* ============================================================
   Provenly app tables
   ============================================================ */

// One company / org per account.
export const company = sqliteTable("company", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  // Credits: 1 credit = 1 certificate generation. Free signup grants 5.
  credits: integer("credits").notNull().default(5),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type CertSignature = { name: string; title: string; image: string | null };
export type CertCustomField = { key: string; value: string };

// Full render payload stored alongside indexed columns.
export type CertData = {
  template: string;
  orientation: string;
  title: string;
  recipientName: string;
  recipientEmail?: string;
  eventName: string;
  bodyText: string;
  issueDate: string;
  expiryDate: string;
  brandColor: string;
  font: string;
  orgName: string;
  logo: string | null;
  seal: string;
  signatures: CertSignature[];
  grade: string;
  showGrade: boolean;
  skills: string[];
  customFields: CertCustomField[];
  serial: string;
  border: string;
};

export const certificate = sqliteTable("certificate", {
  id: text("id").primaryKey(), // serial, e.g. PRV-2026-XXXX-XXXX
  companyId: text("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email"),
  title: text("title").notNull(),
  eventName: text("event_name"),
  issueDate: text("issue_date").notNull(),
  expiryDate: text("expiry_date"),
  status: text("status", { enum: ["verified", "draft", "revoked"] })
    .notNull()
    .default("verified"),
  data: text("data", { mode: "json" }).$type<CertData>().notNull(),
  pdfUrl: text("pdf_url"),
  pngUrl: text("png_url"),
  views: integer("views").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const payment = sqliteTable("payment", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  cfOrderId: text("cf_order_id").notNull().unique(),
  amountInr: integer("amount_inr").notNull(),
  credits: integer("credits").notNull(),
  status: text("status", { enum: ["created", "paid", "failed"] })
    .notNull()
    .default("created"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Company = typeof company.$inferSelect;
export type Certificate = typeof certificate.$inferSelect;
export type Payment = typeof payment.$inferSelect;
