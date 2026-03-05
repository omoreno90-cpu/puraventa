import fs from "fs"
import path from "path"
import { auth } from "@clerk/nextjs/server"

export const runtime = "nodejs"

function getFilePath() {
  return path.join(process.cwd(), "data", "anuncios.json")
}

function readAnuncios() {
  try {
    const raw = fs.readFileSync(getFilePath(), "utf8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeAnuncios(anuncios: any[]) {
  fs.writeFileSync(getFilePath(), JSON.stringify(anuncios, null, 2))
}

/* CREAR ANUNCIO */

export async function POST(req: Request) {

  const { userId } = await auth()

  if (!userId) {
    return Response.json(
      { ok: false, error: "Debes iniciar sesión" },
      { status: 401 }
    )
  }

  const body = await req.json()

  const anuncios = readAnuncios()

  const anuncio = {
    id: Date.now().toString(),
    userId,
    titulo: body.titulo,
    descripcion: body.descripcion,
    precio: body.precio,
    provincia: body.provincia,
    ciudad: body.ciudad,
    categoria: body.categoria,
    subcategoria: body.subcategoria,
    whatsapp: body.whatsapp,
    fotos: body.fotos || [],
    createdAt: new Date().toISOString()
  }

  anuncios.unshift(anuncio)

  writeAnuncios(anuncios)

  return Response.json({
    ok: true,
    anuncio
  })
}

/* LISTAR ANUNCIOS */

export async function GET() {

  const anuncios = readAnuncios()

  return Response.json({
    ok: true,
    anuncios
  })
}