import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  try {
    const anuncios = await listAnuncios();
    return json({ ok: true, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error listando anuncios" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const anuncio: Anuncio = {
      id: crypto.randomUUID(),

      titulo: body.titulo ?? "",
      descripcion: body.descripcion ?? "",
      precio: Number(body.precio ?? 0),

      provincia: body.provincia ?? "",
      canton: body.canton ?? "",

      categoria: body.categoria ?? "",
      subcategoria: body.subcategoria ?? "",

      whatsapp: body.whatsapp ?? "",

      fotos: Array.isArray(body.fotos) ? body.fotos : [],

      createdAt: new Date().toISOString(),
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios();

    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error creando anuncio" }, 500);
  }
}
