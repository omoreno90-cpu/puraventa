// app/api/anuncios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  deleteAnuncio,
  getAnuncio,
  updateAnuncio,
  type Anuncio,
} from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// Next 16 (validator): context.params ES Promise<{id:string}>
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(id);
    if (!anuncio) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error leyendo anuncio" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Partial<Anuncio> & Record<string, any>;

    // Normaliza nombres (UI vieja: canton; API: ciudad)
    const patch: Partial<Anuncio> = {
      ...body,
      ciudad: body?.ciudad ?? body?.canton ?? undefined,
      // NO permitimos cambiar id/createdAt aquí
      id: undefined as any,
      createdAt: undefined as any,
    };

    // Limpieza: evita meter undefined “sucio”
    Object.keys(patch).forEach((k) => {
      // @ts-ignore
      if (patch[k] === undefined) delete patch[k];
    });

    const actualizado = await updateAnuncio(id, patch);
    if (!actualizado) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: actualizado });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error actualizando anuncio" }, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ok = await deleteAnuncio(id);
    if (!ok) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error borrando anuncio" }, 500);
  }
}
