export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const DB_KEY = "puraventa/anuncios.json";

async function readAll(): Promise<any[]> {
  const items = await list({ prefix: DB_KEY, limit: 10 });

  // Si no existe todavía, lista vacía
  const exact = items.blobs.find((b) => b.pathname === DB_KEY);
  if (!exact) return [];

  const res = await fetch(exact.url, { cache: "no-store" });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeAll(all: any[]) {
  await put(DB_KEY, JSON.stringify(all, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false as any, // por compatibilidad
  });
}

export async function GET() {
  try {
    const all = await readAll();
    return NextResponse.json(all, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "No se pudo leer anuncios", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nuevo = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      titulo: String(body.titulo || "").trim(),
      precio: Number(body.precio || 0),
      provincia: String(body.provincia || "").trim(),
      canton: String(body.canton || "").trim(),
      categoria: String(body.categoria || "").trim(),
      descripcion: String(body.descripcion || "").trim(),
      whatsapp: String(body.whatsapp || "").trim(),
      fotos: Array.isArray(body.fotos) ? body.fotos : [],
      creadoEn: body.creadoEn ? String(body.creadoEn) : new Date().toISOString(),
      ownerToken: String(body.ownerToken || ""),
    };

    if (!nuevo.titulo || !nuevo.provincia || !nuevo.canton || !nuevo.categoria || !nuevo.descripcion || !nuevo.whatsapp) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const all = await readAll();
    all.unshift(nuevo);
    await writeAll(all);

    return NextResponse.json({ ok: true, anuncio: nuevo }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "No se pudo publicar en el servidor.", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}
