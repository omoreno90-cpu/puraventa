// lib/anunciosStore.ts
import { Redis } from "@upstash/redis";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string; // (antes "canton")
  whatsapp: string;
  fotos: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt: string;
  updatedAt?: string;
};

const r = Redis.fromEnv();

// Keys
const IDS_KEY = "puraventa:anuncios:ids";
const keyFor = (id: string) => `puraventa:anuncio:${id}`;

// Helpers
function safeArray(x: unknown): string[] {
  // fuerza a string[] aunque la lib devuelva unknown
  if (!Array.isArray(x)) return [];
  return x.filter((v) => typeof v === "string");
}

export async function addAnuncio(anuncio: Anuncio): Promise<void> {
  // Guardar el anuncio
  await r.set(keyFor(anuncio.id), anuncio);

  // Añadir ID al inicio (más reciente primero)
  await r.lpush(IDS_KEY, anuncio.id);
}

export async function listAnuncios(): Promise<Anuncio[]> {
  // ⬇️ AQUÍ está la clave: ids SIEMPRE string[]
  const raw = await r.lrange(IDS_KEY, 0, -1);
  const ids: string[] = safeArray(raw);

  if (ids.length === 0) return [];

  // Traer anuncios en paralelo (sin mget para evitar typings raros)
  const anuncios = await Promise.all(
    ids.map((id: string) => r.get<Anuncio>(keyFor(id)))
  );

  // filtra null/undefined
  return anuncios.filter(Boolean) as Anuncio[];
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const a = await r.get<Anuncio>(keyFor(id));
  return a ?? null;
}

export async function updateAnuncio(id: string, patch: Partial<Anuncio>): Promise<Anuncio | null> {
  const current = await getAnuncio(id);
  if (!current) return null;

  // normaliza canton->ciudad si llega así
  const anyPatch: any = patch as any;
  if (anyPatch?.canton && !anyPatch?.ciudad) anyPatch.ciudad = anyPatch.canton;

  const updated: Anuncio = {
    ...current,
    ...anyPatch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await r.set(keyFor(id), updated);
  return updated;
}

export async function deleteAnuncio(id: string): Promise<boolean> {
  const exists = await r.exists(keyFor(id));
  if (!exists) return false;

  await r.del(keyFor(id));

  // Quitar ID de la lista (puede haber duplicados si antes se metió varias veces)
  await r.lrem(IDS_KEY, 0, id);

  return true;
}
