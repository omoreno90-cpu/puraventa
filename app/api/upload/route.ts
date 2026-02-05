export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

function isConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/upload" });
}

export async function POST(req: Request) {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "Falta BLOB_READ_WRITE_TOKEN en Vercel Environment Variables" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta file" }, { status: 400 });
    }

    // límite 5MB
    if (file.size > 5_000_000) {
      return NextResponse.json({ error: "Cada foto debe pesar menos de 5 MB." }, { status: 400 });
    }

    const safeName = (file.name || "foto.jpg").replace(/[^\w.\-]+/g, "_");
    const key = `puraventa/${Date.now()}-${safeName}`;

    const blob = await put(key, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ ok: true, url: blob.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Upload falló", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}
