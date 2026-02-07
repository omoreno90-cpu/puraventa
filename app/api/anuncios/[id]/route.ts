import { NextRequest, NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio, type Anuncio } from "@/lib/anunciosStore";

type Ctx = { params: Promise<{ id: string }> };

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const a = await getAnuncio(id);
    if (!a) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: a });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error leyendo anuncio" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const patch: Partial<Anuncio> = {
      titulo: body?.titulo ?? undefined,
      descripcion: body?.descripcion ?? undefined,

      precio: body?.precio === undefined ? undefined : Number(body.precio),

      provincia: body?.provincia ?? undefined,
      canton: body?.canton ?? undefined,

      categoria: body?.categoria ?? undefined,
      subcategoria: body?.subcategoria ?? undefined,

      whatsapp: body?.whatsapp ?? undefined,
      fotos: Array.isArray(body?.fotos) ? body.fotos : undefined,
    };

    const updated = await updateAnuncio(id, patch);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error actualizando anuncio" }, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const a = await getAnuncio(id);
    if (!a) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    await deleteAnuncio(id);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error borrando anuncio" }, 500);
  }
}
