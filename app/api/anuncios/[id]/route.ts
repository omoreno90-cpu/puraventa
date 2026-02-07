import { NextRequest, NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ Next 16 validator: params como Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(String(id));

    if (!anuncio) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const updated = await updateAnuncio(String(id), body);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    await deleteAnuncio(String(id));
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
