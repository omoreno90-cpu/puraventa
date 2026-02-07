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

    // mínimos
    const titulo = String(body?.titulo ?? "").trim();
    const descripcion = String(body?.descripcion ?? "").trim();
    const provincia = String(body?.provincia ?? "").trim();
    const ciudad = String(body?.ciudad ?? body?.canton ?? "").trim();
    const whatsapp = String(body?.whatsapp ?? "").trim();
    const categoria = String(body?.categoria ?? "").trim();
    const subcategoria = String(body?.subcategoria ?? "").trim();
    const fotos = Array.isArray(body?.fotos) ? body.fotos.map(String) : [];

    const precioNum = Number(body?.precio);
    if (!titulo || titulo.length < 3) return json({ ok: false, error: "Título inválido" }, 400);
    if (!descripcion || descripcion.length < 5) return json({ ok: false, error: "Descripción inválida" }, 400);
    if (!Number.isFinite(precioNum) || precioNum <= 0) return json({ ok: false, error: "Precio inválido" }, 400);
    if (!provincia) return json({ ok: false, error: "Provincia inválida" }, 400);

    // 🚗 Vehículos (opcionales)
    const vehiculoAno =
      body?.vehiculoAno === undefined || body?.vehiculoAno === null || body?.vehiculoAno === ""
        ? undefined
        : Number(body.vehiculoAno);

    const marchamoAlDia =
      body?.marchamoAlDia === undefined || body?.marchamoAlDia === null || body?.marchamoAlDia === ""
        ? undefined
        : Boolean(body.marchamoAlDia);

    const dekraAlDia =
      body?.dekraAlDia === undefined || body?.dekraAlDia === null || body?.dekraAlDia === ""
        ? undefined
        : Boolean(body.dekraAlDia);

    const dekraMes = String(body?.dekraMes ?? "").trim() || undefined;

    const anuncio: Anuncio = {
      id: crypto.randomUUID(),
      titulo,
      descripcion,
      precio: precioNum,
      provincia,
      ciudad,
      whatsapp,
      fotos,
      categoria: categoria || undefined,
      subcategoria: subcategoria || undefined,

      createdAt: new Date().toISOString(),
      updatedAt: undefined,

      vehiculoAno,
      marchamoAlDia,
      dekraAlDia,
      dekraMes,
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios(200);
    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error creando anuncio" }, 500);
  }
}
