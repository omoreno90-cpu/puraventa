// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

export type Anuncio = {
  id: string;

  titulo: string;
  descripcion: string;
  precio: number;

  provincia: string;
  // En tu UI usas "canton" pero en API lo llamaste "ciudad" a veces.
  // Guardamos como "ciudad" para el API y compatibilizamos.
  ciudad: string;

  whatsapp: string;

  categoria: string;
  subcategoria?: string;

  fotos: string[];

  // Vehículos
  anoVehiculo?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string; // "Enero"..."Diciembre"

  createdAt: string;
  updatedAt?: string;
};

const IDS_KEY = "puraventa:anuncios:ids";
const keyFor = (id: string) => `puraventa:anuncio:${id}`;

function hasRedisEnv() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis | null {
  if (!hasRedisEnv()) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ---------- Fallback a JSON (si no hay Redis env) ----------
const DATA_FILE = path.join(process.cwd(), "data", "anuncios.json");

async function readFileStore(): Promise<Anuncio[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Anuncio[]) : [];
  } catch {
    return [];
  }
}

async function writeFileStore(items: Anuncio[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

// ---------- CRUD ----------
export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  const redis = getRedis();
  if (!redis) {
    const all = await readFileStore();
    // más nuevos primero
    return all
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  }

  const ids = (await redis.lrange(IDS_KEY, 0, limit - 1)) as string[];
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const keys = ids.map(keyFor);

  // ✅ Tipado robusto (Upstash a veces tipa mget raro)
  const raw = await redis.mget(...keys);
  const anuncios = raw as unknown as (Anuncio | null)[];

  return anuncios.filter(Boolean) as Anuncio[];
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();
  if (!redis) {
    const all = await readFileStore();
    return all.find((a) => a.id === id) ?? null;
  }

  const a = await redis.get<Anuncio>(keyFor(id));
  return (a as Anuncio | null) ?? null;
}

export async function addAnuncio(anuncio: Anuncio): Promise<Anuncio> {
  const redis = getRedis();
  if (!redis) {
    const all = await readFileStore();
    const next = [anuncio, ...all.filter((x) => x.id !== anuncio.id)];
    await writeFileStore(next);
    return anuncio;
  }

  await redis.set(keyFor(anuncio.id), anuncio);
  // lo ponemos el primero y evitamos duplicados
  await redis.lrem(IDS_KEY, 0, anuncio.id);
  await redis.lpush(IDS_KEY, anuncio.id);
  return anuncio;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const redis = getRedis();
  if (!redis) {
    const all = await readFileStore();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const actualizado: Anuncio = {
      ...all[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = actualizado;
    await writeFileStore(all);
    return actualizado;
  }

  const actual = await redis.get<Anuncio>(keyFor(id));
  if (!actual) return null;

  const actualizado: Anuncio = {
    ...(actual as Anuncio),
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(keyFor(id), actualizado);
  return actualizado;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    const all = await readFileStore();
    const next = all.filter((a) => a.id !== id);
    await writeFileStore(next);
    return next.length !== all.length;
  }

  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
  return true;
}
