import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const id = Date.now().toString();

    const anuncio = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`anuncio:${id}`, anuncio);

    return NextResponse.json({ ok: true, anuncio });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Error guardando anuncio" },
      { status: 500 }
    );
  }
}