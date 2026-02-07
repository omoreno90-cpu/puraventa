import { NextResponse, NextRequest } from "next/server";
import { getAnuncio, updateAnuncio, deleteAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// IMPORTANTE: params NO es Promise. (Lo que te rompía el build)
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const anuncio = await getAnuncio(params.id);
    if (!anuncio) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const updated = await updateAnuncio(params.id, body);
    if (!updated) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const existing = await getAnuncio(params.id);
    if (!existing) return json({ ok: false, error: "No encontrado" }, 404);

    // deleteAnuncio devuelve void => NO lo metas en un if
    await deleteAnuncio(params.id);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
