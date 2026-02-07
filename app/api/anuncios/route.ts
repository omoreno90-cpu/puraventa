import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

export async function GET() {
  try {
    const anuncios = await listAnuncios();
    return NextResponse.json({ ok: true, anuncios });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error listando anuncios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    const titulo = String(body?.titulo ?? "").trim();
    const descripcion = String(body?.descripcion ?? "").trim();
    const precio = Number(body?.precio);
    const provincia = String(body?.provincia ?? "").trim();

    // Tu UI a veces manda "canton" y otras "ciudad"
    const ciudad = String(body?.canton ?? body?.ciudad ?? "").trim();

    const whatsapp = String(body?.whatsapp ?? "").trim();
    const fotos = Array.isArray(body?.fotos) ? body.fotos.map((x: any) => String(x)) : [];

    const categoria = String(body?.categoria ?? "").trim() || undefined;
    const subcategoria = String(body?.subcategoria ?? "").trim() || undefined;

    if (!titulo || titulo.length < 3) {
      return NextResponse.json({ ok: false, error: "Título inválido" }, { status: 400 });
    }
    if (!descripcion || descripcion.length < 5) {
      return NextResponse.json({ ok: false, error: "Descripción inválida" }, { status: 400 });
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      return NextResponse.json({ ok: false, error: "Precio inválido" }, { status: 400 });
    }
    if (!provincia) {
      return NextResponse.json({ ok: false, error: "Provincia obligatoria" }, { status: 400 });
    }
    if (!ciudad) {
      return NextResponse.json({ ok: false, error: "Cantón/Ciudad obligatoria" }, { status: 400 });
    }
    if (!whatsapp) {
      return NextResponse.json({ ok: false, error: "WhatsApp obligatorio" }, { status: 400 });
    }

    const anuncio: Anuncio = {
      id: crypto.randomUUID(),
      titulo,
      descripcion,
      precio,
      provincia,
      ciudad,
      whatsapp,
      fotos,
      categoria,
      subcategoria,
      createdAt: new Date().toISOString(),
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios();
    return NextResponse.json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error creando anuncio" }, { status: 500 });
  }
}
