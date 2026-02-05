// app/api/anuncios/[id]/route.ts
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
  fotos?: string[]; // URLs
  createdAt?: string;
  updatedAt?: string;
};

// ---------- Store en memoria (para compilar + funcionar básico) ----------
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

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// ---------- GET /api/anuncios/:id ----------
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const store = getStore();
  const anuncio = store.get(id);

  if (!anuncio) {
    return json({ ok: false, error: "Anuncio no encontrado", id }, 404);
  }

  return json({ ok: true, anuncio });
}

// ---------- PUT /api/anuncios/:id ----------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body: Partial<Anuncio>;
  try {
    body = (await req.json()) as Partial<Anuncio>;
  } catch {
    return json({ ok: false, error: "Body JSON inválido" }, 400);
  }

  const store = getStore();
  const existing = store.get(id);

  if (!existing) {
    return json({ ok: false, error: "Anuncio no encontrado", id }, 404);
  }

  const updated: Anuncio = {
    ...existing,
    ...body,
    id, // nunca cambies el id
    updatedAt: new Date().toISOString(),
  };

  store.set(id, updated);
  return json({ ok: true, anuncio: updated });
}

// ---------- DELETE /api/anuncios/:id ----------
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const store = getStore();
  const existed = store.delete(id);

  if (!existed) {
    return json({ ok: false, error: "Anuncio no encontrado", id }, 404);
  }

  return json({ ok: true, deleted: true, id });
}
