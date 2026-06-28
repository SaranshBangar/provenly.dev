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

// Shared credit / plan pool — one per user, spanning all their organizations.
// Named "wallet" to avoid colliding with Better Auth's own `account` table.
export const wallet = sqliteTable("wallet", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  // Credits: 1 credit = 1 certificate generation. Free signup grants 5.
  credits: integer("credits").notNull().default(5),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// An organization. A user can own many. The table keeps the v1 name "company"
// so the `company_id` FK used across the app does not have to change.
export const company = sqliteTable("company", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// An event within an organization (e.g. "Annual Hackathon 2026").
export const event = sqliteTable("event", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  date: text("date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// A reusable certificate template / "type" (participation, winner, special...).
export const template = sqliteTable("template", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  // Templates depend on events: each belongs to one event. Nullable in the DB so
  // pre-existing rows survive the migration; required for newly created templates.
  eventId: text("event_id").references(() => event.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("participation"),
  data: text("data", { mode: "json" }).$type<CertData>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type CertSignature = { name: string; title: string; image: string | null };
export type CertCustomField = { key: string; value: string };

// A free-form, draggable element layered on top of the template ("Figma-lite").
// Coordinates/size are percentages of the canvas so they scale at any zoom.
export type CertElement = {
  id: string;
  type: "image" | "text" | "shape";
  x: number; // % from left (0-100)
  y: number; // % from top (0-100)
  w: number; // % width
  h: number; // % height
  rot: number; // degrees
  z: number; // stacking order
  src?: string; // image element
  text?: string; // text element
  color?: string; // text color / shape fill
  bg?: string; // text background
  fontSize?: number; // px at base (landscape) scale
  fontWeight?: number;
  fontFamily?: string;
  align?: "left" | "center" | "right";
  shape?: "rect" | "ellipse" | "line";
  radius?: number; // shape corner radius / image rounding (px)
  opacity?: number; // 0-1
};

// Full render payload stored alongside indexed columns.
export type CertData = {
  template: string;
  orientation: string;
  title: string;
  subtitle: string;
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
  background: string;
  elements: CertElement[];
};

export const certificate = sqliteTable("certificate", {
  id: text("id").primaryKey(), // serial, e.g. PRV-2026-XXXX-XXXX
  companyId: text("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  eventId: text("event_id"),
  templateId: text("template_id"),
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
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallet.id, { onDelete: "cascade" }),
  cfOrderId: text("cf_order_id").notNull().unique(),
  amountInr: integer("amount_inr").notNull(),
  credits: integer("credits").notNull(),
  status: text("status", { enum: ["created", "paid", "failed"] })
    .notNull()
    .default("created"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Wallet = typeof wallet.$inferSelect;
export type Company = typeof company.$inferSelect;
export type EventRow = typeof event.$inferSelect;
export type TemplateRow = typeof template.$inferSelect;
export type Certificate = typeof certificate.$inferSelect;
export type Payment = typeof payment.$inferSelect;
