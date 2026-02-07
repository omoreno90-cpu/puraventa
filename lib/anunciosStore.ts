import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;

  provincia: string;
  ciudad?: string;
  canton?: string;

  whatsapp?: string;
  fotos?: string[];

  categoria?: string;
  subcategoria?: string;

  createdAt: string;
  updatedAt?: string;

  // 🚗 Vehículos (opcionales)
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

const IDS_KEY = "puraventa:anuncios:ids";

function keyFor(id: string) {
  return `puraventa:anuncio:${id}`;
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN en env.");
  }

  return new Redis({ url, token });
}

function legacyFilePath() {
  return path.join(process.cwd(), "data", "anuncios.json");
}

function readLegacyAll(): Anuncio[] {
  try {
    const p = legacyFilePath();
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Anuncio[]) : [];
  } catch {
    return [];
  }
}

function findLegacyById(id: string): Anuncio | null {
  const all = readLegacyAll();
  const a = all.find((x: any) => String(x?.id) === String(id));
  return a ? (a as Anuncio) : null;
}

async function ensureInRedis(a: Anuncio) {
  const redis = getRedis();
  const id = String(a.id);

  // normaliza createdAt
  const createdAt = String((a as any).createdAt ?? (a as any).creadoEn ?? new Date().toISOString());

  const normalized: Anuncio = {
    ...a,
    id,
    createdAt,
    // compat: si venía con canton/ciudad mezclado
    ciudad: (a as any).ciudad ?? (a as any).canton ?? a.ciudad,
    canton: (a as any).canton ?? (a as any).ciudad ?? a.canton,
  };

  await redis.set(keyFor(id), normalized);

  // mete el id en la lista si no está (sin duplicados)
  await redis.lrem(IDS_KEY, 0, id);
  await redis.lpush(IDS_KEY, id);
}

export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  const redis = getRedis();

  const idsRaw = (await redis.lrange(IDS_KEY, 0, Math.max(0, limit - 1))) as unknown;
  const ids = (Array.isArray(idsRaw) ? idsRaw : []) as string[];

  // Si Redis está vacío, intenta importar TODO el legacy (si existe)
  if (ids.length === 0) {
    const legacy = readLegacyAll();
    if (legacy.length > 0) {
      for (const a of legacy) {
        if (a?.id) await ensureInRedis(a);
      }
      const ids2Raw = (await redis.lrange(IDS_KEY, 0, Math.max(0, limit - 1))) as unknown;
      const ids2 = (Array.isArray(ids2Raw) ? ids2Raw : []) as string[];
      return await listByIds(ids2);
    }
    return [];
  }

  return await listByIds(ids);
}

async function listByIds(ids: string[]): Promise<Anuncio[]> {
  const redis = getRedis();
  const keys = ids.map(keyFor);

  // Upstash typings a veces son raros con mget => casteo robusto
  const raw = (await (redis as any).mget(...keys)) as unknown;
  const arr = (Array.isArray(raw) ? raw : []) as (Anuncio | null)[];

  const out = arr.filter(Boolean) as Anuncio[];

  // ordena por createdAt desc si existe
  out.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return out;
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();
  const key = keyFor(id);

  const fromRedis = (await redis.get(key)) as Anuncio | null;
  if (fromRedis?.id) return fromRedis;

  // fallback legacy: si existe en data/anuncios.json, lo migramos y devolvemos
  const legacy = findLegacyById(id);
  if (legacy?.id) {
    await ensureInRedis(legacy);
    const again = (await redis.get(key)) as Anuncio | null;
    return again?.id ? again : null;
  }

  return null;
}

export async function addAnuncio(a: Anuncio): Promise<void> {
  await ensureInRedis(a);
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const current = await getAnuncio(id);
  if (!current) return null;

  const updated: Anuncio = {
    ...current,
    ...patch,
    id: String(current.id),
    updatedAt: new Date().toISOString(),
  };

  await ensureInRedis(updated);
  return updated;
}

export async function deleteAnuncio(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
}
