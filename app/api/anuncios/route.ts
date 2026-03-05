import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAll, saveAll, newId, type Anuncio } from "@/lib/anunciosStore";

export async function GET() {
  const anuncios = await getAll();
  return NextResponse.json({ ok: true, anuncios });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const anuncio: Anuncio = {
    id: newId(),
    titulo: String(body.titulo || "").trim(),
    descripcion: String(body.descripcion || "").trim(),
    precio: Number(body.precio || 0),
    provincia: String(body.provincia || "").trim(),
    ciudad: String(body.ciudad || "").trim(),
    categoria: body.categoria ? String(body.categoria) : undefined,
    subcategoria: body.subcategoria ? String(body.subcategoria) : undefined,
    whatsapp: String(body.whatsapp || "").trim(),
    fotos: Array.isArray(body.fotos) ? body.fotos.map(String) : [],
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
    vehiculoAno: Number.isFinite(Number(body.vehiculoAno)) ? Number(body.vehiculoAno) : undefined,
    marchamoAlDia: typeof body.marchamoAlDia === "boolean" ? body.marchamoAlDia : undefined,
    dekraAlDia: typeof body.dekraAlDia === "boolean" ? body.dekraAlDia : undefined,
    dekraMes: typeof body.dekraMes === "string" ? body.dekraMes : undefined,
  };

  if (anuncio.titulo.length < 5) {
    return NextResponse.json({ ok: false, error: "Título muy corto" }, { status: 400 });
  }
  if (anuncio.descripcion.length < 10) {
    return NextResponse.json({ ok: false, error: "Descripción muy corta" }, { status: 400 });
  }
  if (!Number.isFinite(anuncio.precio) || anuncio.precio <= 0) {
    return NextResponse.json({ ok: false, error: "Precio inválido" }, { status: 400 });
  }
  if (!anuncio.whatsapp || anuncio.whatsapp.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ ok: false, error: "WhatsApp inválido" }, { status: 400 });
  }

  const anuncios = await getAll();
  anuncios.unshift(anuncio);
  await saveAll(anuncios);

  return NextResponse.json({ ok: true, anuncio });
}