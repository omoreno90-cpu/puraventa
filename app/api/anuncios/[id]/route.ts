import { NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio, type Anuncio } from "@/lib/anunciosStore";

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

async function getId(ctx: Ctx): Promise<string> {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  const anuncio = await getAnuncio(id);

  if (!anuncio) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado", id }, { status: 404 });
  }

  return NextResponse.json({ ok: true, anuncio });
}

export async function PUT(req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  const body = (await req.json().catch(() => ({}))) as Partial<Anuncio>;

  const actualizado = await updateAnuncio(id, body);
  if (!actualizado) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado", id }, { status: 404 });
  }

  return NextResponse.json({ ok: true, anuncio: actualizado });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  const ok = await deleteAnuncio(id);

  if (!ok) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado", id }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: true, id });
}
