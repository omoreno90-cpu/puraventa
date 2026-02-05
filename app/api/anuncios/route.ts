import { NextResponse } from "next/server";

/**
 * API base de anuncios
 * GET  -> listar anuncios
 * POST -> crear anuncio
 */

// store en memoria (temporal, pero compila y funciona)
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

// ---------- GET /api/anuncios ----------
export async function GET() {
  const store = getStore();
  const anuncios = Array.from(store.values());
  return NextResponse.json({ ok: true, anuncios });
}

// ---------- POST /api/anuncios ----------
export async function POST(req: Request) {
  let body: Partial<Anuncio>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  const anuncio: Anuncio = {
    id,
    titulo: body.titulo ?? "",
    descripcion: body.descripcion ?? "",
    precio: body.precio,
    provincia: body.provincia,
    ciudad: body.ciudad,
    whatsapp: body.whatsapp,
    createdAt: new Date().toISOString(),
  };

  const store = getStore();
  store.set(id, anuncio);

  return NextResponse.json({ ok: true, anuncio });
}
