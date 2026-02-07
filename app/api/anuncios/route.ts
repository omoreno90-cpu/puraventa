import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio, MESES_DEKRA } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function uuid() {
  // suficiente para MVP
  return crypto.randomUUID();
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
    const body = (await req.json().catch(() => ({}))) as any;

    const titulo = String(body.titulo ?? "").trim();
    const descripcion = String(body.descripcion ?? "").trim();

    const precioNum = Number(body.precio);
    const provincia = String(body.provincia ?? "").trim();
    const canton = String(body.canton ?? body.ciudad ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").replace(/\D/g, "");
    const fotos = Array.isArray(body.fotos) ? body.fotos.map(String) : [];

    const categoria = String(body.categoria ?? "").trim();
    const subcategoria = String(body.subcategoria ?? "").trim() || undefined;

    if (titulo.length < 5) return json({ ok: false, error: "Título demasiado corto." }, 400);
    if (descripcion.length < 10) return json({ ok: false, error: "Descripción demasiado corta." }, 400);
    if (!Number.isFinite(precioNum) || precioNum <= 0) return json({ ok: false, error: "Precio inválido." }, 400);
    if (!provincia) return json({ ok: false, error: "Provincia obligatoria." }, 400);
    if (!canton) return json({ ok: false, error: "Cantón/ciudad obligatoria." }, 400);
    if (whatsapp.length < 8) return json({ ok: false, error: "WhatsApp inválido." }, 400);
    if (!categoria) return json({ ok: false, error: "Categoría obligatoria." }, 400);

    // ✅ Campos vehículos (solo si categoría lo es)
    let vehiculoAno: number | undefined = undefined;
    let marchamoAlDia: boolean | undefined = undefined;
    let dekraAlDia: boolean | undefined = undefined;
    let dekraMes: (typeof MESES_DEKRA)[number] | undefined = undefined;

    if (categoria === "Motos y vehículos") {
      vehiculoAno = Number(body.vehiculoAno);
      if (!Number.isFinite(vehiculoAno) || vehiculoAno < 1950 || vehiculoAno > new Date().getFullYear() + 1) {
        return json({ ok: false, error: "Año del vehículo inválido." }, 400);
      }

      marchamoAlDia = Boolean(body.marchamoAlDia);
      dekraAlDia = Boolean(body.dekraAlDia);

      const mes = String(body.dekraMes ?? "").trim();
      if (!MESES_DEKRA.includes(mes as any)) {
        return json({ ok: false, error: "Mes de DEKRA inválido." }, 400);
      }
      dekraMes = mes as any;
    }

    const anuncio: Anuncio = {
      id: uuid(),
      titulo,
      descripcion,
      precio: precioNum,

      provincia,
      canton,
      ciudad: canton,

      whatsapp,
      fotos,

      categoria,
      subcategoria,

      vehiculoAno,
      marchamoAlDia,
      dekraAlDia,
      dekraMes,

      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios();
    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error guardando anuncio" }, 500);
  }
}
