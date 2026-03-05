import { NextRequest, NextResponse } from "next/server";

type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad?: string;
  whatsapp?: string;
  fotos?: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt?: string;
  updatedAt?: string;

  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name} en env.`);
  return v;
}

const REDIS_URL = () => envOrThrow("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
const REDIS_TOKEN = () => envOrThrow("UPSTASH_REDIS_REST_TOKEN");

async function redis(cmdPath: string) {
  const res = await fetch(`${REDIS_URL()}/${cmdPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN()}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error Upstash");
  return data?.result;
}

const KEY_ALL = "pv:anuncios:v1";

async function readAll(): Promise<Anuncio[]> {
  const raw = await redis(`get/${encodeURIComponent(KEY_ALL)}`);
  if (!raw) return [];
  try {
    return JSON.parse(String(raw)) as Anuncio[];
  } catch {
    return [];
  }
}

async function writeAll(list: Anuncio[]) {
  await redis(`set/${encodeURIComponent(KEY_ALL)}/${encodeURIComponent(JSON.stringify(list))}`);
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const all = await readAll();
    const anuncio = all.find((a) => a.id === id);

    if (!anuncio) {
      return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, anuncio }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const patch = (await req.json().catch(() => ({}))) as Partial<Anuncio>;
    const all = await readAll();

    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });
    }

    const prev = all[idx];
    const next: Anuncio = {
      ...prev,
      ...patch,
      id: prev.id,
      createdAt: prev.createdAt,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = next;
    await writeAll(all);

    return NextResponse.json({ ok: true, anuncio: next }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const all = await readAll();
    const next = all.filter((a) => a.id !== id);

    if (next.length === all.length) {
      return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });
    }

    await writeAll(next);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}