// app/api/anuncios/[id]/route.ts
import { NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const anuncio = await getAnuncio(params.id);
    if (!anuncio) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json().catch(() => ({}))) as any;

    // normaliza nombres (si llega canton)
    if (patch?.canton && !patch?.ciudad) patch.ciudad = patch.canton;

    const updated = await updateAnuncio(params.id, patch);
    if (!updated) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const ok = await deleteAnuncio(params.id);
    if (!ok) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
