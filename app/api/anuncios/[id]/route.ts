// app/api/anuncios/[id]/route.ts
import { NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

async function getId(ctx: Ctx): Promise<string> {
  const p = await ctx.params;
  return p.id;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const anuncio = await getAnuncio(id);
    if (!anuncio) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const patch = (await req.json().catch(() => ({}))) as any;

    // normaliza nombres (si llega canton)
    if (patch?.canton && !patch?.ciudad) patch.ciudad = patch.canton;

    const updated = await updateAnuncio(id, patch);
    if (!updated) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const ok = await deleteAnuncio(id);
    if (!ok) return json({ ok: false, error: "No encontrado" }, 404);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
