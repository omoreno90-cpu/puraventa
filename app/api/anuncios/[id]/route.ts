import { NextResponse } from "next/server";

/**
 * API por anuncio individual
 * GET    -> obtener anuncio
 * PUT    -> actualizar anuncio
 * DELETE -> borrar anuncio
 */

type Anuncio = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  provincia?: string;
  ciudad?: string;
  whatsapp?: string;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS__: Map<string, Anuncio> | undefined;
}

function getStore(): Map<string, Anuncio> {
  if (!globalThis.__PURAVENTA_ANUNCIOS__) {
    globalThis.__PURAVENTA_ANUNCIOS__ = new Map();
  }
  return globalThis.__PURAVENTA_ANUNCIOS__!;
}

// ---------- GET /api/anuncios/:id ----------
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const anuncio = store.get(params.id);

  if (!anuncio) {
    return NextResponse.json(
      { ok: false, error: "No encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, anuncio });
}

// ---------- PUT /api/anuncios/:id ----------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const anuncio = store.get(params.id);

  if (!anuncio) {
    return NextResponse.json(
      { ok: false, error: "No encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const actualizado: Anuncio = {
    ...anuncio,
    ...body,
    id: params.id,
  };

  store.set(params.id, actualizado);

  return NextResponse.json({ ok: true, anuncio: actualizado });
}

// ---------- DELETE /api/anuncios/:id ----------
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const ok = store.delete(params.id);

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "No encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deleted: true });
}
