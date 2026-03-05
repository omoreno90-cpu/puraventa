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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { userId } = await auth()

  if (!userId) {
    return Response.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  const body = await req.json()

  const anuncios = readAnuncios()

  const index = anuncios.findIndex((a: any) => a.id === params.id)

  if (index === -1) {
    return Response.json(
      { ok: false, error: "Anuncio no encontrado" },
      { status: 404 }
    )
  }

  if (anuncios[index].userId !== userId) {
    return Response.json(
      { ok: false, error: "No puedes editar este anuncio" },
      { status: 403 }
    )
  }

  anuncios[index] = {
    ...anuncios[index],
    titulo: body.titulo,
    descripcion: body.descripcion,
    precio: body.precio,
    provincia: body.provincia,
    ciudad: body.ciudad,
    whatsapp: body.whatsapp,
    fotos: body.fotos || []
  }

  writeAnuncios(anuncios)

  return Response.json({
    ok: true,
    anuncio: anuncios[index]
  })
}