export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function isConfigured() {
  return (
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET
  );
}

// GET para comprobar que existe la ruta
export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/upload" }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "Faltan variables CLOUDINARY_* en .env.local" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta file" }, { status: 400 });
    }

    // límite 2MB
    if (file.size > 2_000_000) {
      return NextResponse.json(
        { error: "Cada foto debe pesar menos de 2 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "puraventa", resource_type: "image" },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Upload falló", detalle: String(e?.message || e) },
      { status: 500 }
    );
  }
}
