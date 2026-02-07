import { Redis } from "@upstash/redis";

export type MesDekrA =
  | "Enero"
  | "Febrero"
  | "Marzo"
  | "Abril"
  | "Mayo"
  | "Junio"
  | "Julio"
  | "Agosto"
  | "Septiembre"
  | "Octubre"
  | "Noviembre"
  | "Diciembre";

export const MESES_DEKRA: MesDekrA[] = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export type Anuncio = {
  id: string;

  titulo: string;
  descripcion: string;
  precio: number;

  provincia: string;
  ciudad?: string; // compat
  canton?: string; // compat

  whatsapp: string;
  fotos: string[];

  categoria: string;
  subcategoria?: string;

  // ✅ Solo para "Motos y vehículos"
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: MesDekrA;

  createdAt: string;
  updatedAt?: string;
};

const IDS_KEY = "pv:anuncios:ids";

function keyFor(id: string) {
  return `pv:anuncio:${id}`;
}

let _redis: Redis | null = null;

export function getRedis() {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // No rompas build por esto, pero sí deja claro el error en runtime
    throw new Error("Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN en env.");
  }

  _redis = new Redis({ url, token });
  return _redis;
}

export async function addAnuncio(anuncio: Anuncio) {
  const redis = getRedis();
  await redis.set(keyFor(anuncio.id), anuncio);
  await redis.lpush(IDS_KEY, anuncio.id);
}

export async function listAnuncios(): Promise<Anuncio[]> {
  const redis = getRedis();

  const ids = (await redis.lrange(IDS_KEY, 0, 199)) as unknown as string[];
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const keys = ids.map(keyFor);

  // Tipado robusto: algunos tipos de Upstash pueden liar mget
  const raw = (await (redis as any).mget(...keys)) as unknown;
  const anuncios = raw as (Anuncio | null)[];

  return (Array.isArray(anuncios) ? anuncios : []).filter(Boolean) as Anuncio[];
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();
  const a = (await redis.get(keyFor(id))) as unknown as Anuncio | null;
  return a ?? null;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const redis = getRedis();
  const prev = await getAnuncio(id);
  if (!prev) return null;

  const actualizado: Anuncio = {
    ...prev,
    ...patch,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(keyFor(id), actualizado);
  return actualizado;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const redis = getRedis();
  const prev = await getAnuncio(id);
  if (!prev) return false;

  await redis.del(keyFor(id));
  // elimina UNA aparición del id en la lista
  await (redis as any).lrem(IDS_KEY, 0, id);
  return true;
}
