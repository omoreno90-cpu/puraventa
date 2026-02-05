export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const DB_KEY = "puraventa/anuncios.json";

async function readAll(): Promise<any[]> {
  const items = await list({ prefix: DB_KEY, limit: 10 });
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
    addRandomSuffix: false as any,
  });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = String(params?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Falta id en la URL" }, { status: 400 });

    const all = await readAll();
    const item = all.find((a: any) => String(a.id) === id);

    if (!item) {
      return NextResponse.json({ error: "No existe", idPedida: id }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Error leyendo anuncio", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = String(params?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Falta id en la URL" }, { status: 400 });

    const all = await readAll();
    const antes = all.length;
    const nuevo = all.filter((a: any) => String(a.id) !== id);

    if (nuevo.length === antes) {
      return NextResponse.json({ error: "No existe", idPedida: id }, { status: 404 });
    }

    await writeAll(nuevo);
    return NextResponse.json({ ok: true, borrado: id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Error borrando anuncio", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}
