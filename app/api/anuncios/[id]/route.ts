import { NextRequest, NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ Next 16 validator: params como Promise
type Ctx = { params: Promise<{ id: string }> };

function stripPrivate(a: any) {
  if (!a || typeof a !== "object") return a;
  const { ownerTokenHash, ...rest } = a;
  return rest;
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return toHex(digest);
}

async function requireOwner(req: NextRequest, anuncio: any) {
  const token = String(req.headers.get("x-owner-token") || "").trim();
  if (!token) return { ok: false, error: "Falta el código de propietario." };

  const hash = await sha256Hex(token);
  const expected = String(anuncio?.ownerTokenHash || "");
  if (!expected || hash !== expected) return { ok: false, error: "Código incorrecto." };

  return { ok: true };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(String(id));

    if (!anuncio) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio: stripPrivate(anuncio) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    const auth = await requireOwner(req, existing);
    if (!auth.ok) return json({ ok: false, error: auth.error }, 403);

    const body = await req.json().catch(() => ({}));

    // seguridad extra: nunca permitas que el cliente meta ownerTokenHash
    if (body && typeof body === "object") {
      delete (body as any).ownerTokenHash;
      delete (body as any).ownerToken;
    }

    const updated = await updateAnuncio(String(id), body);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: stripPrivate(updated) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    const auth = await requireOwner(req, existing);
    if (!auth.ok) return json({ ok: false, error: auth.error }, 403);

    await deleteAnuncio(String(id));
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
