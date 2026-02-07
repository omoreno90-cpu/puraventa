// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  // compat: antes "canton", ahora algunos sitios "ciudad"
  canton?: string;
  ciudad?: string;
  categoria?: string;
  subcategoria?: string;
  whatsapp: string;
  fotos: string[];
  createdAt: string;
  updatedAt?: string;
};

const IDS_KEY = "puraventa:anuncios:ids";
const ITEM_KEY = (id: string) => `puraventa:anuncios:${id}`;

// ✅ Declara globals para que TS no se queje con globalThis
declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_MEM__: Map<string, Anuncio> | undefined;
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS_IDS_MEM__: string[] | undefined;
}
export {}; // importante para que el declare global aplique en módulo

function getRedis() {
  // Si tienes KV_* en env ya vale. Upstash también suele dar REDIS_URL.
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN; // por si acaso en local

  if (!url || !token) {
    // Si no hay redis configurado, seguimos con memoria (no rompe build).
    return null;
  }

  return new Redis({ url, token });
}

function getMem() {
  if (!globalThis.__PURAVENTA_ANUNCIOS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_MEM__ = new Map();
  if (!globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__) globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = [];
  return {
    map: globalThis.__PURAVENTA_ANUNCIOS_MEM__!,
    ids: globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__!,
  };
}

function normalizeAnuncio(a: any): Anuncio {
  const createdAt = String(a?.createdAt ?? a?.creadoEn ?? new Date().toISOString());
  const updatedAt = a?.updatedAt ? String(a.updatedAt) : undefined;

  return {
    id: String(a.id),
    titulo: String(a.titulo ?? ""),
    descripcion: String(a.descripcion ?? ""),
    precio: Number(a.precio ?? 0),
    provincia: String(a.provincia ?? ""),
    canton: a?.canton ? String(a.canton) : undefined,
    ciudad: a?.ciudad ? String(a.ciudad) : undefined,
    categoria: a?.categoria ? String(a.categoria) : undefined,
    subcategoria: a?.subcategoria ? String(a.subcategoria) : undefined,
    whatsapp: String(a.whatsapp ?? ""),
    fotos: Array.isArray(a.fotos) ? a.fotos.map(String) : [],
    createdAt,
    updatedAt,
  };
}

export async function listAnuncios(): Promise<Anuncio[]> {
  const mem = getMem();
  const redis = getRedis();

  // Si ya tenemos IDs en memoria, resolvemos desde memoria
  if (mem.ids.length > 0) {
    const out: Anuncio[] = [];
    for (const id of mem.ids) {
      const a = mem.map.get(id);
      if (a) out.push(a);
    }
    // orden newest-first
    out.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    return out;
  }

  // Si no hay Redis configurado -> memoria vacía
  if (!redis) return [];

  const ids = (await redis.lrange(IDS_KEY, 0, -1)) as unknown as string[] | null;
  const safeIds = Array.isArray(ids) ? ids.map(String) : [];
  mem.ids.splice(0, mem.ids.length, ...safeIds);

  if (safeIds.length === 0) return [];

  // Cargar items con mget (pueden venir nulls)
  const keys = safeIds.map((id) => ITEM_KEY(id));

  // Tipado “a prueba de bombas”:
  const raw = (await redis.mget(...keys)) as unknown as Array<any | null> | null;
  const rows = Array.isArray(raw) ? raw : [];

  const anuncios: Anuncio[] = [];
  for (let i = 0; i < safeIds.length; i++) {
    const id = safeIds[i];
    const val = rows[i];
    if (!val) continue;
    const a = normalizeAnuncio(val);
    mem.map.set(id, a);
    anuncios.push(a);
  }

  anuncios.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
  return anuncios;
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const mem = getMem();
  const cached = mem.map.get(id);
  if (cached) return cached;

  const redis = getRedis();
  if (!redis) return null;

  const val = await redis.get(ITEM_KEY(id));
  if (!val) return null;

  const a = normalizeAnuncio(val);
  mem.map.set(id, a);

  // si aún no estaba en ids, lo metemos delante
  if (!mem.ids.includes(id)) mem.ids.unshift(id);

  return a;
}

export async function createAnuncio(input: Omit<Anuncio, "id" | "createdAt" | "updatedAt"> & { id: string }): Promise<Anuncio> {
  const mem = getMem();
  const redis = getRedis();

  const now = new Date().toISOString();
  const a: Anuncio = normalizeAnuncio({
    ...input,
    createdAt: now,
    updatedAt: now,
  });

  // memoria
  mem.map.set(a.id, a);
  if (!mem.ids.includes(a.id)) mem.ids.unshift(a.id);

  // redis
  if (redis) {
    await redis.set(ITEM_KEY(a.id), a);
    // evitamos duplicados en la lista
    // (si ya está, lo sacamos y lo ponemos delante)
    await redis.lrem(IDS_KEY, 0, a.id);
    await redis.lpush(IDS_KEY, a.id);
  }

  return a;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const prev = await getAnuncio(id);
  if (!prev) return null;

  const mem = getMem();
  const redis = getRedis();

  const next: Anuncio = normalizeAnuncio({
    ...prev,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });

  mem.map.set(id, next);

  if (redis) {
    await redis.set(ITEM_KEY(id), next);
  }

  return next;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const mem = getMem();
  const redis = getRedis();

  mem.map.delete(id);
  mem.ids = mem.ids.filter((x) => x !== id);
  globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = mem.ids; // mantener referencia

  if (redis) {
    await redis.del(ITEM_KEY(id));
    await redis.lrem(IDS_KEY, 0, id);
  }

  return true;
}

export function clearMemCache() {
  globalThis.__PURAVENTA_ANUNCIOS_MEM__ = new Map();
  globalThis.__PURAVENTA_ANUNCIOS_IDS_MEM__ = [];
}
