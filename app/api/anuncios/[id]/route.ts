import { NextResponse } from "next/server";
import {
  deleteAnuncio,
  getAnuncio,
  updateAnuncio,
  type Anuncio,
} from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const a = await getAnuncio(params.id);
    if (!a) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio: a });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error leyendo anuncio" }, 500);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();

    const patch: Partial<Anuncio> = {
      titulo: body.titulo ?? undefined,
      descripcion: body.descripcion ?? undefined,
      precio: body.precio === undefined ? undefined : Number(body.precio),

      provincia: body.provincia ?? undefined,
      canton: body.canton ?? undefined,

      categoria: body.categoria ?? undefined,
      subcategoria: body.subcategoria ?? undefined,

      whatsapp: body.whatsapp ?? undefined,

      fotos: Array.isArray(body.fotos) ? body.fotos : undefined,
    };

    const updated = await updateAnuncio(params.id, patch);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error actualizando anuncio" }, 500);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const a = await getAnuncio(params.id);
    if (!a) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    await deleteAnuncio(params.id);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error borrando anuncio" }, 500);
  }
}
