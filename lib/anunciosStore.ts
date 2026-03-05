import { promises as fs } from "fs";
import path from "path";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string;
  categoria?: string;
  subcategoria?: string;
  whatsapp: string;
  fotos?: string[];
  ownerId: string; // Clerk userId
  createdAt: string;
  updatedAt: string;
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const KEY_ALL = "puraventa:anuncios:v1";

function hasUpstash() {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

async function upstash<T>(cmd: string, ...args: (string | number)[]): Promise<T> {
  const url = `${UPSTASH_URL}/${cmd}/${args.map((a) => encodeURIComponent(String(a))).join("/")}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Upstash error");
  return data?.result as T;
}

function filePath() {
  return path.join(process.cwd(), "data", "anuncios.json");
}

async function readFileAll(): Promise<Anuncio[]> {
  try {
    const raw = await fs.readFile(filePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Anuncio[]) : [];
  } catch {
    return [];
  }
}

async function writeFileAll(anuncios: Anuncio[]) {
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(anuncios, null, 2), "utf8");
}

export async function getAll(): Promise<Anuncio[]> {
  if (hasUpstash()) {
    const raw = await upstash<string | null>("GET", KEY_ALL);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Anuncio[]) : [];
    } catch {
      return [];
    }
  }
  return readFileAll();
}

export async function saveAll(anuncios: Anuncio[]) {
  if (hasUpstash()) {
    await upstash<"OK">("SET", KEY_ALL, JSON.stringify(anuncios));
    return;
  }
  await writeFileAll(anuncios);
}

export function newId() {
  return `${Date.now()}${Math.floor(Math.random() * 100000)}`;
}