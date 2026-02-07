// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  canton: string;
  categoria: string;
  subcategoria?: string;
  whatsapp: string;
  fotos: string[];
  createdAt: string;
};

const redis = Redis.fromEnv();

const IDS_KEY = "puraventa:anuncios:ids";
const ITEM_KEY = (id: string) => `puraventa:anuncios:item:${id}`;

// Cache en memoria (solo para acelerar en el mismo runtime)
declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_CACHE__:
    | { ids: string[]; items: Map<string, Anuncio>; loadedAt: number }
    | undefined;
}

function cache() {
  if (!globalThis.__PURAVENTA_CACHE__) {
    globalThis.__PURAVENTA_CACHE__ = {
      ids: [],
      items: new Map<string, Anuncio>(),
      loadedAt: 0,
    };
  }
  return globalThis.__PURAVENTA_CACHE__!;
}

export async function listAnuncios(): Promise<Anuncio[]> {
  const c = cache();

  // recarga “suave” cada 5s para no machacar Redis
  const now = Date.now();
  if (c.loadedAt && now - c.loadedAt < 5000 && c.ids.length) {
    const arr = c.ids.map((id) => c.items.get(id)).filter(Boolean) as Anuncio[];
    return arr;
  }

  const ids = (await redis.get<string[]>(IDS_KEY)) ?? [];
  const safeIds = Array.isArray(ids) ? ids : [];

  if (safeIds.length === 0) {
    c.ids = [];
    c.items.clear();
    c.loadedAt = now;
    return [];
  }

  const keys = safeIds.map((id) => ITEM_KEY(id));
  const values = (await redis.mget(...keys)) as (Anuncio | null)[];

  const map = new Map<string, Anuncio>();
  for (let i = 0; i < safeIds.length; i++) {
    const id = safeIds[i];
    const v = values[i];
    if (v && typeof v === "object") map.set(id, v);
  }

  c.ids = safeIds.filter((id) => map.has(id));
  c.items = map;
  c.loadedAt = now;

  return c.ids.map((id) => c.items.get(id)!).filter(Boolean);
}

export async function addAnuncio(a: Anuncio): Promise<void> {
  // guarda item
  await redis.set(ITEM_KEY(a.id), a);

  // mete id al principio (más nuevo primero)
  const ids = (await redis.get<string[]>(IDS_KEY)) ?? [];
  const safeIds = Array.isArray(ids) ? ids : [];
  const next = [a.id, ...safeIds.filter((x) => x !== a.id)];
  await redis.set(IDS_KEY, next);

  // actualiza cache
  const c = cache();
  c.items.set(a.id, a);
  c.ids = next;
  c.loadedAt = Date.now();
}
