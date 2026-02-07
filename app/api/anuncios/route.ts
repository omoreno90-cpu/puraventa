// app/api/anuncios/route.ts
import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  const anuncios = await listAnuncios();
  return NextResponse.json({ ok: true, anuncios }, { status: 200 });
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return bad("Body JSON inválido.");
  }

  const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const provincia = typeof body?.provincia === "string" ? body.provincia.trim() : "";
  const canton = typeof body?.canton === "string" ? body.canton.trim() : "";
  const categoria = typeof body?.categoria === "string" ? body.categoria.trim() : "";
  const subcategoria = typeof body?.subcategoria === "string" ? body.subcategoria.trim() : undefined;

  const precio = Number(body?.precio);
  const whatsapp = typeof body?.whatsapp === "string" ? body.whatsapp.replace(/\D/g, "") : "";

  const fotos = Array.isArray(body?.fotos)
    ? body.fotos.filter((x: any) => typeof x === "string" && x.startsWith("http"))
    : [];

  if (titulo.length < 3) return bad("Título demasiado corto.");
  if (descripcion.length < 5) return bad("Descripción demasiado corta.");
  if (!Number.isFinite(precio) || precio <= 0) return bad("Precio inválido.");
  if (!provincia) return bad("Provincia obligatoria.");
  if (!canton) return bad("Cantón obligatorio.");
  if (!categoria) return bad("Categoría obligatoria.");
  if (whatsapp.length < 8) return bad("WhatsApp inválido.");

  const anuncio: Anuncio = {
    id: crypto.randomUUID(),
    titulo,
    descripcion,
    precio,
    provincia,
    canton,
    categoria,
    ...(subcategoria ? { subcategoria } : {}),
    whatsapp,
    fotos,
    createdAt: new Date().toISOString(),
  };

  await addAnuncio(anuncio);

  const anuncios = await listAnuncios();
  return NextResponse.json({ ok: true, anuncio, anuncios }, { status: 201 });
}
