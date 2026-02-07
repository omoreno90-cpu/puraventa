// app/api/anuncios/route.ts
import { NextResponse } from "next/server";
import { addAnuncio, listAnuncios, type Anuncio } from "@/lib/anunciosStore";
import { nanoid } from "nanoid";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

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

    const precio = Number(body?.precio);
    const provincia = String(body?.provincia ?? "").trim();
    const ciudad = String(body?.ciudad ?? body?.canton ?? "").trim(); // compat
    const whatsapp = String(body?.whatsapp ?? "").replace(/\D/g, "").trim();

    // ✅ AQUÍ el fix: siempre string
    const categoria = String(body?.categoria ?? "Otros").trim() || "Otros";
    const subcategoria = String(body?.subcategoria ?? "").trim() || undefined;

    const fotos = Array.isArray(body?.fotos) ? body.fotos.map(String) : [];

    // Vehículos
    const anoVehiculoRaw = body?.anoVehiculo;
    const anoVehiculo =
      anoVehiculoRaw === undefined || anoVehiculoRaw === null || anoVehiculoRaw === ""
        ? undefined
        : Number(anoVehiculoRaw);

    const marchamoAlDia = body?.marchamoAlDia === true ? true : body?.marchamoAlDia === false ? false : undefined;
    const dekraAlDia = body?.dekraAlDia === true ? true : body?.dekraAlDia === false ? false : undefined;

    let dekraMes = String(body?.dekraMes ?? "").trim();
    if (dekraMes) {
      if (!MESES.includes(dekraMes as any)) {
        return json({ ok: false, error: "Mes de DEKRA inválido" }, 400);
      }
    } else {
      dekraMes = "";
    }

    // Validaciones mínimas
    if (titulo.length < 5) return json({ ok: false, error: "Título demasiado corto" }, 400);
    if (descripcion.length < 10) return json({ ok: false, error: "Descripción demasiado corta" }, 400);
    if (!Number.isFinite(precio) || precio <= 0) return json({ ok: false, error: "Precio inválido" }, 400);
    if (!provincia) return json({ ok: false, error: "Provincia obligatoria" }, 400);
    if (!ciudad) return json({ ok: false, error: "Cantón/Ciudad obligatoria" }, 400);
    if (whatsapp.length < 8) return json({ ok: false, error: "WhatsApp inválido" }, 400);

    if (anoVehiculo !== undefined) {
      if (!Number.isFinite(anoVehiculo) || anoVehiculo < 1900 || anoVehiculo > new Date().getFullYear() + 1) {
        return json({ ok: false, error: "Año de vehículo inválido" }, 400);
      }
    }

    const anuncio: Anuncio = {
      id: nanoid(),
      titulo,
      descripcion,
      precio,
      provincia,
      ciudad,
      whatsapp,
      categoria,
      subcategoria,
      fotos,
      anoVehiculo,
      marchamoAlDia,
      dekraAlDia,
      dekraMes: dekraMes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };

    await addAnuncio(anuncio);

    const anuncios = await listAnuncios(200);
    return json({ ok: true, anuncio, anuncios });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error guardando anuncio" }, 500);
  }
}
