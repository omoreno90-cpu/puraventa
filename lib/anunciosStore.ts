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

function normalize(a: any): Anuncio {
  const id = String(a?.id ?? "");
  const createdAt = String(a?.createdAt ?? a?.creadoEn ?? new Date().toISOString());

  const ciudad = (a?.ciudad ?? a?.canton ?? "").toString().trim() || undefined;
  const canton = (a?.canton ?? a?.ciudad ?? "").toString().trim() || undefined;

  const out: Anuncio = {
    id,
    titulo: String(a?.titulo ?? "").trim(),
    descripcion: String(a?.descripcion ?? "").trim(),
    precio: Number(a?.precio ?? 0),

    provincia: String(a?.provincia ?? "").trim(),
    ciudad,
    canton,

    whatsapp: a?.whatsapp ? String(a.whatsapp) : undefined,
    fotos: Array.isArray(a?.fotos) ? a.fotos.map(String) : [],

    categoria: a?.categoria ? String(a.categoria).trim() : undefined,
    subcategoria: a?.subcategoria ? String(a.subcategoria).trim() : undefined,

    createdAt,
    updatedAt: a?.updatedAt ? String(a.updatedAt) : undefined,

    vehiculoAno:
      a?.vehiculoAno === undefined || a?.vehiculoAno === null || a?.vehiculoAno === ""
        ? undefined
        : Number(a.vehiculoAno),
    marchamoAlDia:
      a?.marchamoAlDia === undefined || a?.marchamoAlDia === null || a?.marchamoAlDia === ""
        ? undefined
        : Boolean(a.marchamoAlDia),
    dekraAlDia:
      a?.dekraAlDia === undefined || a?.dekraAlDia === null || a?.dekraAlDia === ""
        ? undefined
        : Boolean(a.dekraAlDia),
    dekraMes: a?.dekraMes ? String(a.dekraMes).trim() : undefined,
  };

  // saneo mínimo
  if (!Number.isFinite(out.precio)) out.precio = 0;
  if (!Number.isFinite(out.vehiculoAno as any)) out.vehiculoAno = undefined;

  return out;
}

async function ensureInRedis(a: any) {
  const redis = getRedis();
  const normalized = normalize(a);
  if (!normalized.id) return;

  const id = normalized.id;

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

  const raw = (await (redis as any).mget(...keys)) as unknown;
  const arr = (Array.isArray(raw) ? raw : []) as (Anuncio | null)[];

  const out = arr.filter(Boolean).map((x) => normalize(x)) as Anuncio[];

  // ordena por createdAt desc
  out.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return out;
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();
  const key = keyFor(id);

  const fromRedis = (await redis.get(key)) as any;
  if (fromRedis?.id) return normalize(fromRedis);

  // fallback legacy: si existe en data/anuncios.json, lo migramos y devolvemos
  const legacy = findLegacyById(id);
  if (legacy?.id) {
    await ensureInRedis(legacy);
    const again = (await redis.get(key)) as any;
    return again?.id ? normalize(again) : null;
  }

  return null;
}

export async function addAnuncio(a: Anuncio): Promise<void> {
  await ensureInRedis(a);
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const current = await getAnuncio(id);
  if (!current) return null;

  const updated: Anuncio = normalize({
    ...current,
    ...patch,
    id: String(current.id),
    updatedAt: new Date().toISOString(),
  });

  await ensureInRedis(updated);
  return updated;
}

export async function deleteAnuncio(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
}
