import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type Anuncio = {
  id: string
  titulo: string
  descripcion: string
  precio: number
  provincia: string
  ciudad: string
  whatsapp: string
  fotos?: string[]
  createdAt?: string
  updatedAt?: string
}

function dataFilePath() {
  return path.join(process.cwd(), "data", "anuncios.json")
}

async function readAll(): Promise<Anuncio[]> {
  const file = dataFilePath()
  try {
    const raw = await fs.readFile(file, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Anuncio[]) : []
  } catch {
    return []
  }
}

async function writeAll(anuncios: Anuncio[]) {
  const file = dataFilePath()
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(anuncios, null, 2), "utf8")
}

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params
  const anuncios = await readAll()
  const anuncio = anuncios.find((a) => a.id === id)

  if (!anuncio) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, anuncio })
}

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 })
  }

  const anuncios = await readAll()
  const idx = anuncios.findIndex((a) => a.id === id)

  if (idx === -1) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 })
  }

  const prev = anuncios[idx]

  const updated: Anuncio = {
    ...prev,
    titulo: typeof body.titulo === "string" ? body.titulo : prev.titulo,
    descripcion: typeof body.descripcion === "string" ? body.descripcion : prev.descripcion,
    precio: Number.isFinite(Number(body.precio)) ? Number(body.precio) : prev.precio,
    provincia: typeof body.provincia === "string" ? body.provincia : prev.provincia,
    ciudad: typeof body.ciudad === "string" ? body.ciudad : prev.ciudad,
    whatsapp: typeof body.whatsapp === "string" ? body.whatsapp : prev.whatsapp,
    fotos: Array.isArray(body.fotos) ? body.fotos.map(String) : prev.fotos,
    updatedAt: new Date().toISOString(),
  }

  anuncios[idx] = updated
  await writeAll(anuncios)

  return NextResponse.json({ ok: true, anuncio: updated })
}

export async function DELETE(
  _req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params
  const anuncios = await readAll()

  const next = anuncios.filter((a) => a.id !== id)

  if (next.length === anuncios.length) {
    return NextResponse.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 })
  }

  await writeAll(next)
  return NextResponse.json({ ok: true })
}