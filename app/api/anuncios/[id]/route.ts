// app/api/anuncios/[id]/route.ts
import { NextResponse } from "next/server";
import {
  deleteAnuncio,
  getAnuncio,
  updateAnuncio,
  type Anuncio,
} from "@/lib/anunciosStore";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await getAnuncio(params.id);
  if (!a) return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, anuncio: a });
}

export async function PUT(req: Request, { params }: Ctx) {
  const body = (await req.json().catch(() => null)) as Partial<Anuncio> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });

  const next = await updateAnuncio(params.id, body);
  if (!next) return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, anuncio: next });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await getAnuncio(params.id);
  if (!a) return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });

  await deleteAnuncio(params.id);
  return NextResponse.json({ ok: true });
}
