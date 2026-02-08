import { NextRequest, NextResponse } from "next/server";
import { deleteAnuncio, getAnuncio, updateAnuncio } from "@/lib/anunciosStore";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ Next 16 validator: params como Promise
type Ctx = { params: Promise<{ id: string }> };

function normalizeWs(x: any) {
  return String(x ?? "").replace(/\D/g, "");
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const anuncio = await getAnuncio(String(id));

    if (!anuncio) return json({ ok: false, error: "Anuncio no encontrado" }, 404);
    return json({ ok: true, anuncio });
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

    // 🔒 Solo el dueño (whatsapp) puede editar
    const wsOwner = normalizeWs(existing.whatsapp);
    const wsBody = normalizeWs(body?.whatsapp);

    if (!wsOwner || !wsBody || wsOwner !== wsBody) {
      return json({ ok: false, error: "No autorizado. WhatsApp incorrecto." }, 403);
    }

    const updated = await updateAnuncio(String(id), body);
    if (!updated) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    return json({ ok: true, anuncio: updated });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await getAnuncio(String(id));
    if (!existing) return json({ ok: false, error: "Anuncio no encontrado" }, 404);

    // 🔒 WhatsApp por query: /api/anuncios/:id?whatsapp=88888888
    const wsOwner = normalizeWs(existing.whatsapp);
    const wsQuery = normalizeWs(req.nextUrl.searchParams.get("whatsapp"));

    if (!wsOwner || !wsQuery || wsOwner !== wsQuery) {
      return json({ ok: false, error: "No autorizado. WhatsApp incorrecto." }, 403);
    }

    await deleteAnuncio(String(id));
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "Error" }, 500);
  }
}
