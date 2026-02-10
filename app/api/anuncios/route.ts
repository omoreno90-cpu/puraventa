import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function makeOwnerToken() {
  // token fuerte y simple
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export async function GET() {
  try {
    const anuncios = await listAnuncios(200);

    // 🔒 nunca expongas ownerToken en listados
    const safe = anuncios.map((a) => {
      const { ownerToken, ...rest } = a as any;
      return rest;
    });

    return json({ ok: true, anuncios: safe });
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

    const ownerToken = makeOwnerToken();

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

      ownerToken,
    };

    await addAnuncio(anuncio);

    // lista safe
    const anuncios = await listAnuncios(200);
    const safe = anuncios.map((a) => {
      const { ownerToken, ...rest } = a as any;
      return rest;
    });

    // 🔒 Devolvemos ownerToken SOLO en respuesta del POST
    // para que el frontend lo guarde en localStorage.
    const { ownerToken: _ot, ...safeAnuncio } = anuncio as any;
    return json({ ok: true, anuncio: safeAnuncio, ownerToken, anuncios: safe });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error creando anuncio" }, 500);
  }
}
