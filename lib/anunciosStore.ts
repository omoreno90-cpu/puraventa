// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string; // en tu UI lo llamas canton; en API lo guardamos como ciudad
  whatsapp: string;
  fotos: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt: string;
  updatedAt?: string;
};

const IDS_KEY = "puraventa:anuncios:ids";
const keyFor = (id: string) => `puraventa:anuncio:${id}`;

// Si NO hay env vars, usamos memoria (local) para que no reviente build/dev.
declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_MEM__:
    | Map<string, Anuncio>
    | undefined;
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_IDS_MEM__:
    | string[]
    | undefined;
}

function getMem() {
  if (!globalThis.__PURAVENTA_ANUNCIOS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_MEM__ = new Map();
  if (!globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = [];
  return {
    map: globalThis.__PURAVENTA_ANUNCIOS_MEM__!,
    ids: globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__!,
  };
}

const hasRedisEnv =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedisEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  if (!redis) {
    const mem = getMem();
    const ids = mem.ids.slice(-limit).reverse(); // últimos primero
    const anuncios = ids.map((id) => mem.map.get(id)).filter(Boolean) as Anuncio[];
    return anuncios;
  }

  const ids = (await redis.lrange<string[]>(IDS_KEY, 0, limit - 1)) ?? [];
  if (ids.length === 0) return [];

  // Upstash puede devolver ids como unknown, aseguramos string[]
  const idsStr = (Array.isArray(ids) ? ids : []).filter((x) => typeof x === "string");

  const anuncios = await Promise.all(idsStr.map((id) => redis.get<Anuncio>(keyFor(id))));
  return anuncios.filter(Boolean) as Anuncio[];
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  if (!id) return null;

  if (!redis) {
    const mem = getMem();
    return mem.map.get(id) ?? null;
  }

  const a = await redis.get<Anuncio>(keyFor(id));
  return a ?? null;
}

export async function addAnuncio(anuncio: Anuncio): Promise<void> {
  if (!redis) {
    const mem = getMem();
    mem.map.set(anuncio.id, anuncio);
    // ponlo primero (más reciente)
    mem.ids = mem.ids.filter((x) => x !== anuncio.id);
    mem.ids.unshift(anuncio.id);
    globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = mem.ids;
    return;
  }

  await redis.set(keyFor(anuncio.id), anuncio);
  // newest-first
  await redis.lrem(IDS_KEY, 0, anuncio.id);
  await redis.lpush(IDS_KEY, anuncio.id);
}

export async function updateAnuncio(
  id: string,
  patch: Partial<Anuncio>
): Promise<Anuncio | null> {
  const actual = await getAnuncio(id);
  if (!actual) return null;

  const actualizado: Anuncio = {
    ...actual,
    ...patch,
    id: actual.id,
    createdAt: actual.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (!redis) {
    const mem = getMem();
    mem.map.set(id, actualizado);
    return actualizado;
  }

  await redis.set(keyFor(id), actualizado);
  return actualizado;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const actual = await getAnuncio(id);
  if (!actual) return false;

  if (!redis) {
    const mem = getMem();
    mem.map.delete(id);
    mem.ids = mem.ids.filter((x) => x !== id);
    globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = mem.ids;
    return true;
  }

  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
  return true;
}
