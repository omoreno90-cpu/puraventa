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

function keyFor(id: string) {
  return `puraventa:anuncio:${id}`;
}

// Crear anuncio
export async function addAnuncio(anuncio: Anuncio) {
  await redis.set(keyFor(anuncio.id), anuncio);
  await redis.lpush(IDS_KEY, anuncio.id);
}

// Obtener uno
export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const a = await redis.get<Anuncio>(keyFor(id));
  return a ?? null;
}

// Listar todos
export async function listAnuncios(): Promise<Anuncio[]> {
  const ids = await redis.lrange<string>(IDS_KEY, 0, 200);

  if (!ids || ids.length === 0) return [];

  const anuncios = await Promise.all(
    ids.map((id) => redis.get<Anuncio>(keyFor(id)))
  );

  return anuncios.filter(Boolean) as Anuncio[];
}

// Actualizar
export async function updateAnuncio(id: string, data: Partial<Anuncio>) {
  const actual = await getAnuncio(id);
  if (!actual) return null;

  const actualizado: Anuncio = {
    ...actual,
    ...data,
    id,
  };

  await redis.set(keyFor(id), actualizado);
  return actualizado;
}

// Eliminar
export async function deleteAnuncio(id: string) {
  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
}
