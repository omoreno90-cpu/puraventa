import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;

  provincia: string;
  ciudad?: string;
  canton?: string;

  whatsapp?: string; // se guarda, pero NO lo mostramos en la UI
  fotos?: string[];

  categoria?: string;
  subcategoria?: string;

  createdAt: string;
  updatedAt?: string;

  // ✅ seguridad (owner por WhatsApp)
  ownerPhoneHash?: string;

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

function ownerKey(phoneHash: string) {
  return `puraventa:owner:${phoneHash}`;
}

function sha256hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function normalizePhoneDigits(raw: any) {
  return String(raw ?? "").replace(/\D/g, "");
}

export function phoneHashFromPhone(phoneDigits: string) {
  const p = normalizePhoneDigits(phoneDigits);
  if (!p) return "";
  return sha256hex(p);
}

export function tokenHashFromToken(ownerToken: string) {
  return sha256hex(String(ownerToken ?? ""));
}

export function generateOwnerToken() {
  // token "humano": PV-XXXXXX-XXXXXX-XXXXXX
  const buf = crypto.randomBytes(9).toString("base64url").toUpperCase(); // ~12 chars
  const a = buf.slice(0, 6);
  const b = buf.slice(6, 12);
  const c = crypto.randomBytes(6).toString("base64url").toUpperCase().slice(0, 6);
  return `PV-${a}-${b}-${c}`;
}

function safeEqual(a: string, b: string) {
  // comparación constante (evita timing attacks)
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
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

  const createdAt = String((a as any).createdAt ?? (a as any).creadoEn ?? new Date().toISOString());

  const ws = normalizePhoneDigits((a as any).whatsapp ?? a.whatsapp);
  const phoneHash = (a as any).ownerPhoneHash
    ? String((a as any).ownerPhoneHash)
    : ws
      ? phoneHashFromPhone(ws)
      : undefined;

  const normalized: Anuncio = {
    ...a,
    id,
    createdAt,
    // compat: si venía con canton/ciudad mezclado
    ciudad: (a as any).ciudad ?? (a as any).canton ?? a.ciudad,
    canton: (a as any).canton ?? (a as any).ciudad ?? a.canton,
    whatsapp: ws || undefined,
    ownerPhoneHash: phoneHash,
  };

  await redis.set(keyFor(id), normalized);

  await redis.lrem(IDS_KEY, 0, id);
  await redis.lpush(IDS_KEY, id);
}

export async function listAnuncios(limit = 200): Promise<Anuncio[]> {
  const redis = getRedis();

  const idsRaw = (await redis.lrange(IDS_KEY, 0, Math.max(0, limit - 1))) as unknown;
  const ids = (Array.isArray(idsRaw) ? idsRaw : []) as string[];

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

  const out = arr.filter(Boolean) as Anuncio[];

  out.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return out;
}

export async function getAnuncio(id: string): Promise<Anuncio | null> {
  const redis = getRedis();
  const key = keyFor(id);

  const fromRedis = (await redis.get(key)) as Anuncio | null;
  if (fromRedis?.id) return fromRedis;

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

  // no permitimos cambiar ownerPhoneHash desde fuera
  const { ownerPhoneHash, ...restPatch } = patch as any;

  const updated: Anuncio = {
    ...current,
    ...restPatch,
    id: String(current.id),
    updatedAt: new Date().toISOString(),
    ownerPhoneHash: current.ownerPhoneHash,
    whatsapp: current.whatsapp, // no se cambia aquí (si quieres permitirlo, lo hacemos luego)
  };

  await ensureInRedis(updated);
  return updated;
}

export async function deleteAnuncio(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(keyFor(id));
  await redis.lrem(IDS_KEY, 0, id);
}

/**
 * ✅ OWNER TOKENS (1 por WhatsApp)
 */
export async function getOwnerTokenHash(phoneHash: string): Promise<string | null> {
  const redis = getRedis();
  const v = (await redis.get(ownerKey(phoneHash))) as unknown;
  const s = typeof v === "string" ? v : v ? String(v) : "";
  return s ? s : null;
}

export async function setOwnerTokenHash(phoneHash: string, tokenHash: string): Promise<void> {
  const redis = getRedis();
  await redis.set(ownerKey(phoneHash), tokenHash);
}

export async function verifyOwnerToken(phoneHash: string, ownerToken: string): Promise<boolean> {
  const stored = await getOwnerTokenHash(phoneHash);
  if (!stored) return false;
  const incomingHash = tokenHashFromToken(ownerToken);
  return safeEqual(stored, incomingHash);
}