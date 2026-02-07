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

    const titulo = String(body?.titulo ?? "").trim();
    const descripcion = String(body?.descripcion ?? "").trim();
    const provincia = String(body?.provincia ?? "").trim();
    const ciudad = String(body?.ciudad ?? body?.canton ?? "").trim();
    const whatsapp = String(body?.whatsapp ?? "").trim();
    const fotos = Array.isArray(body?.fotos) ? body.fotos.map(String) : [];
    const categoria = body?.categoria ? String(body.categoria) : undefined;
    const subcategoria = body?.subcategoria ? String(body.subcategoria) : undefined;
    const telefono = body?.telefono ? String(body.telefono) : undefined;

    const precioNum = Number(body?.precio);

    if (!titulo || !descripcion || !provincia || !ciudad || !whatsapp || !Number.isFinite(precioNum)) {
      return json({ ok: false, error: "Faltan campos obligatorios (titulo, descripcion, precio, provincia, ciudad, whatsapp)." }, 400);
    }

    const anuncio: Anuncio = {
      id: crypto.randomUUID(),
      titulo,
      descripcion,
      precio: precioNum,
      provincia,
      ciudad,
      whatsapp,
      fotos,
      categoria,
      subcategoria,
      telefono,
      createdAt: new Date().toISOString(),
    };

    await addAnuncio(anuncio);
    const anuncios = await listAnuncios(200);

    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error creando anuncio" }, 500);
  }
}
