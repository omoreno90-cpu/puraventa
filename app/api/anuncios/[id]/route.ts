import { NextResponse } from "next/server";

type Anuncio = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  provincia?: string;
  ciudad?: string;
  telefono?: string;
  whatsapp?: string;
  fotos?: string[];
  createdAt: string;
  updatedAt?: string;
};

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS__: Map<string, Anuncio> | undefined;
}

function getStore(): Map<string, Anuncio> {
  if (!globalThis.__PURAVENTA_ANUNCIOS__) {
    globalThis.__PURAVENTA_ANUNCIOS__ = new Map<string, Anuncio>();
  }
  return globalThis.__PURAVENTA_ANUNCIOS__!;
}

async function getId(ctx: Ctx): Promise<string> {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);

  const store = getStore();
  const anuncio = store.get(id);

  if (!anuncio) {
    return NextResponse.json(
      { ok: false, error: "Anuncio no encontrado", id },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, anuncio });
}

export async function PUT(req: Request, ctx: Ctx) {
  const id = await getId(ctx);

  const store = getStore();
  const anuncio = store.get(id);

  if (!anuncio) {
    return NextResponse.json(
      { ok: false, error: "Anuncio no encontrado", id },
      { status: 404 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Partial<Anuncio>;

  const actualizado: Anuncio = {
    ...anuncio,
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  };

  store.set(id, actualizado);
  return NextResponse.json({ ok: true, anuncio: actualizado });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);

  const store = getStore();
  const ok = store.delete(id);

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Anuncio no encontrado", id },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deleted: true, id });
}

