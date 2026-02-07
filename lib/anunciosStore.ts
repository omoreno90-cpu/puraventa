// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string;
  whatsapp: string;
  fotos: string[];
  categoria?: string;
  subcategoria?: string;
  telefono?: string;
  createdAt: string;
  updatedAt?: string;
};

let _redis: Redis | null = null;

function redis(): Redis {
  if (_redis) return _redis;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Faltan KV_REST_API_URL / KV_REST_API_TOKEN en env (Upstash).");
  }

  _redis = new Redis({ url, token });
  return _redis;
}

const IDS_KEY = "anuncios:ids";
const keyFor = (id: string) => `anuncio:${id}`;

export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  const r = redis();
  const ids = (await r.lrange<string[]>(IDS_KEY, 0, Math.max(0, limit - 1))) || [];
  if (ids.length === 0) return [];

  const anuncios = await Promise.all(ids.map((id) => r.get<Anuncio>(keyFor(id))));
  return anuncios.filter(Boolean) as Anuncio[];
}

export async function addAnuncio(anuncio: Anuncio): Promise<void> {
  const r = redis();
  await r.set(keyFor(anuncio.id), anuncio);
  // lo ponemos el primero (más nuevo)
  await r.lpush(IDS_KEY, anuncio.id);
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const r = redis();
  const a = await r.get<Anuncio>(keyFor(id));
  return a ?? null;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const r = redis();
  const cur = await r.get<Anuncio>(keyFor(id));
  if (!cur) return null;

  const next: Anuncio = {
    ...cur,
    ...patch,
    id: cur.id,
    createdAt: cur.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await r.set(keyFor(id), next);
  return next;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const r = redis();
  const existed = await r.get<Anuncio>(keyFor(id));
  if (!existed) return false;

  await r.del(keyFor(id));

  // quitar id de la lista (simple y fiable para tu escala)
  const ids = (await r.lrange<string[]>(IDS_KEY, 0, -1)) || [];
  const next = ids.filter((x) => x !== id);
  await r.del(IDS_KEY);
  if (next.length) await r.rpush(IDS_KEY, ...next);

  return true;
}
