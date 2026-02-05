import { NextResponse } from "next/server";
import { getAnunciosStore, type Anuncio } from "@/lib/anunciosStore";

export async function GET() {
  const store = getAnunciosStore();
  const anuncios = Array.from(store.values());
  return NextResponse.json({ ok: true, anuncios });
}

export async function POST(req: Request) {
  let body: Partial<Anuncio>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

  const anuncio: Anuncio = {
    id,
    titulo: body.titulo ?? "",
    descripcion: body.descripcion ?? "",
    precio: body.precio,
    provincia: body.provincia,
    ciudad: body.ciudad,
    telefono: body.telefono,
    whatsapp: body.whatsapp,
    fotos: body.fotos ?? [],
    createdAt: new Date().toISOString(),
  };

  const store = getAnunciosStore();
  store.set(id, anuncio);

  return NextResponse.json({ ok: true, anuncio });
}
