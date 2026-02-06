import { NextResponse } from "next/server";
import { createAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

export async function GET() {
  const anuncios = await listAnuncios();
  return NextResponse.json({ ok: true, anuncios });
}

export async function POST(req: Request) {
  let body: Partial<Anuncio>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const anuncio = await createAnuncio({
    titulo: body.titulo ?? "",
    descripcion: body.descripcion ?? "",
    precio: body.precio,
    provincia: body.provincia,
    ciudad: body.ciudad,
    telefono: body.telefono,
    whatsapp: body.whatsapp,
    fotos: body.fotos ?? [],
  });

  return NextResponse.json({ ok: true, anuncio });
}
