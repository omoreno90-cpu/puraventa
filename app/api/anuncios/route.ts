// app/api/anuncios/route.ts
import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  try {
    const anuncios = await listAnuncios(200);
    return json({ ok: true, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error listando anuncios" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    // Validación mínima (evita undefined que rompe TS + datos)
    const titulo = String(body?.titulo ?? "").trim();
    const descripcion = String(body?.descripcion ?? "").trim();
    const provincia = String(body?.provincia ?? "").trim();
    const ciudad = String(body?.ciudad ?? body?.canton ?? "").trim();
    const whatsapp = String(body?.whatsapp ?? "").trim();
    const precio = Number(body?.precio);

    if (!titulo || titulo.length < 3) return json({ ok: false, error: "Título inválido" }, 400);
    if (!descripcion || descripcion.length < 5) return json({ ok: false, error: "Descripción inválida" }, 400);
    if (!provincia) return json({ ok: false, error: "Provincia requerida" }, 400);
    if (!ciudad) return json({ ok: false, error: "Ciudad/Cantón requerido" }, 400);
    if (!whatsapp) return json({ ok: false, error: "WhatsApp requerido" }, 400);
    if (!Number.isFinite(precio) || precio <= 0) return json({ ok: false, error: "Precio inválido" }, 400);

    const fotos = Array.isArray(body?.fotos) ? body.fotos.map(String) : [];
    const categoria = body?.categoria ? String(body.categoria) : undefined;
    const subcategoria = body?.subcategoria ? String(body.subcategoria) : undefined;

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
      updatedAt: undefined,
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios(200);
    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error creando anuncio" }, 500);
  }
}
