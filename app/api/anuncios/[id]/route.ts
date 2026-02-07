import { NextResponse, NextRequest } from "next/server";
import { getAnuncio, updateAnuncio, deleteAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ Next 16 (con tu validador) está esperando params como Promise<{id:string}>
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(id);
    if (!anuncio) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as any;

    const updated = await updateAnuncio(id, body);
    if (!updated) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(id);
    if (!existing) return json({ ok: false, error: "No encontrado" }, 404);

    // deleteAnuncio devuelve void
    await deleteAnuncio(id);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
