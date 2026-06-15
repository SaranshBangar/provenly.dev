import type { CertData } from "@/db/schema";

export type { CertData };

export const SANS = "'Hanken Grotesk', sans-serif";
export const SERIF = "'Source Serif 4', Georgia, serif";

export function genSerial(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return "PRV-" + new Date().getFullYear() + "-" + seg() + "-" + seg();
}

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function verifyUrl(serial: string, base?: string): string {
  const origin =
    base ||
    (typeof window !== "undefined" ? window.location.origin : "https://provenly.dev");
  return `${origin}/verify/${serial}`;
}

/** Pretty (no-protocol) verify url for display chips. */
export function verifyDisplay(serial: string, base?: string): string {
  return verifyUrl(serial, base).replace(/^https?:\/\//, "");
}

export const DEFAULT_CERT: CertData = {
  template: "classic",
  orientation: "landscape",
  title: "Certificate of Completion",
  recipientName: "Amara Okafor",
  recipientEmail: "",
  eventName: "Full-Stack Web Development Bootcamp",
  bodyText:
    "has successfully completed all requirements and demonstrated outstanding proficiency in modern web engineering practices.",
  issueDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  brandColor: "#0E9F6E",
  font: "Source Serif 4",
  orgName: "Meridian Academy",
  logo: null,
  seal: "verified",
  signatures: [
    { name: "Dr. Lena Hart", title: "Program Director", image: null },
    { name: "Marco Velez", title: "Lead Instructor", image: null },
  ],
  grade: "Distinction — 96%",
  showGrade: true,
  skills: ["React", "Node.js", "PostgreSQL", "System Design"],
  customFields: [
    { key: "Cohort", value: "Spring 2026" },
    { key: "Credits", value: "12 CEU" },
  ],
  serial: "PRV-2026-9X4K-T7QM",
  border: "double",
};
