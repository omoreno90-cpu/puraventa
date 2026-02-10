import { NextRequest, NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio, type Anuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ Next 16 validator: params como Promise
type Ctx = { params: Promise<{ id: string }> };

function publicAnuncio(a: Anuncio) {
  const { ownerToken, ...rest } = a as any;
  return rest as Anuncio;
}

function readOwnerToken(req: NextRequest) {
  return String(req.headers.get("x-owner-token") || "").trim();
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(String(id));

    if (!anuncio) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio: publicAnuncio(anuncio) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    const token = readOwnerToken(req);
    if (!existing.ownerToken) {
      return json({ ok: false, error: "Este anuncio es antiguo y no tiene token. Re-publica el anuncio." }, 409);
    }
    if (!token || token !== existing.ownerToken) {
      return json({ ok: false, error: "No autorizado." }, 403);
    }

    // 🔒 No permitir cambiar ownerToken por PATCH
    if ((body as any)?.ownerToken) delete (body as any).ownerToken;

    const updated = await updateAnuncio(String(id), body);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: publicAnuncio(updated) });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    const token = readOwnerToken(req);
    if (!existing.ownerToken) {
      return json({ ok: false, error: "Este anuncio es antiguo y no tiene token. Re-publica el anuncio." }, 409);
    }
    if (!token || token !== existing.ownerToken) {
      return json({ ok: false, error: "No autorizado." }, 403);
    }

    await deleteAnuncio(String(id));
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
