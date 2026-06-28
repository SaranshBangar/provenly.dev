import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSessionContext } from "@/lib/session";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];

function extFor(type: string) {
  return ({ "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[type] || "bin";
}

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });

  const { env } = getCloudflareContext();
  const key = `assets/${ctx.org.id}/${crypto.randomUUID()}.${extFor(file.type)}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({ url: `/api/file/${key}` });
}
