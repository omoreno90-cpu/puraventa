// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
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

const IDS_KEY = "anuncios:ids";
const anuncioKey = (id: string) => `anuncio:${id}`;

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// fallback local (si ejecutas en local sin env vars)
declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_MEM__: Map<string, Anuncio> | undefined;
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_IDS_MEM__: string[] | undefined;
}
function getMem() {
  if (!globalThis.__PURAVENTA_ANUNCIOS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_MEM__ = new Map();
  if (!globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = [];
  return {
    map: globalThis.__PURAVENTA_ANUNCIOS_MEM__!,
    ids: globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__!,
  };
}

function newId() {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
}

export async function listAnuncios(): Promise<Anuncio[]> {
  const redis = getRedis();

  if (!redis) {
    const mem = getMem();
    return mem.ids.map((id) => mem.map.get(id)).filter(Boolean) as Anuncio[];
  }

  const ids = (await redis.lrange(IDS_KEY, 0, -1)) as unknown as string[];
  if (!ids || ids.length === 0) return [];

  // mget devuelve (T | null)[] y acepta ...keys: string[]
  const keys = ids.map(anuncioKey);
  const anuncios = (await redis.mget<Anuncio[]>(...keys)) as unknown as (Anuncio | null)[];
  return anuncios.filter((x): x is Anuncio => Boolean(x));
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();

  if (!redis) {
    const mem = getMem();
    return mem.map.get(id) ?? null;
  }

  return ((await redis.get(anuncioKey(id))) as unknown as Anuncio | null) ?? null;
}

export async function createAnuncio(input: Omit<Anuncio, "id" | "createdAt" | "updatedAt">): Promise<Anuncio> {
  const id = newId();
  const anuncio: Anuncio = {
    id,
    ...input,
    createdAt: new Date().toISOString(),
  };

  const redis = getRedis();

  if (!redis) {
    const mem = getMem();
    mem.map.set(id, anuncio);
    mem.ids.unshift(id);
    return anuncio;
  }

  await redis.set(anuncioKey(id), anuncio);
  await redis.lpush(IDS_KEY, id);
  return anuncio;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const prev = await getAnuncio(id);
  if (!prev) return null;

  const next: Anuncio = {
    ...prev,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };

  const redis = getRedis();

  if (!redis) {
    const mem = getMem();
    mem.map.set(id, next);
    if (!mem.ids.includes(id)) mem.ids.unshift(id);
    return next;
  }

  await redis.set(anuncioKey(id), next);
  return next;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const redis = getRedis();

  if (!redis) {
    const mem = getMem();
    const existed = mem.map.delete(id);
    globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = mem.ids.filter((x) => x !== id);
    return existed;
  }

  const existed = await redis.del(anuncioKey(id));

  const ids = (await redis.lrange(IDS_KEY, 0, -1)) as unknown as string[];
  if (ids && ids.includes(id)) {
    await redis.del(IDS_KEY);
    const remaining = ids.filter((x) => x !== id);
    if (remaining.length) await redis.rpush(IDS_KEY, ...remaining);
  }

  return existed > 0;
}
