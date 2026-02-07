// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string; // tu "canton" en UI
  whatsapp: string;
  fotos: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt: string;
  updatedAt?: string;
};

const redis = Redis.fromEnv();

const IDS_KEY = "puraventa:anuncios:ids";
const keyFor = (id: string) => `puraventa:anuncio:${id}`;

export async function addAnuncio(a: Anuncio) {
  await redis.set(keyFor(a.id), a);
  // guarda el id delante para que lo último salga primero
  await redis.lpush(IDS_KEY, a.id);
}

export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  const ids = await redis.lrange<string[]>(IDS_KEY, 0, Math.max(0, limit - 1));
  if (!ids || ids.length === 0) return [];

  const anuncios = await Promise.all(ids.map((id) => redis.get<Anuncio>(keyFor(id))));
  return anuncios.filter(Boolean) as Anuncio[];
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const a = await redis.get<Anuncio>(keyFor(id));
  return a ?? null;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const prev = await getAnuncio(id);
  if (!prev) return null;

  const next: Anuncio = {
    ...prev,
    ...patch,
    id: prev.id,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(keyFor(id), next);
  return next;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  await redis.del(keyFor(id));
  // quita el id de la lista (todas las ocurrencias)
  await redis.lrem(IDS_KEY, 0, id);
  return true;
}
