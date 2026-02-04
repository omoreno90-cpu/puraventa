import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "anuncios.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function GET() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const anuncios = JSON.parse(raw);
  return NextResponse.json(anuncios);
}

export async function POST(req: Request) {
  await ensureFile();
  const nuevo = await req.json();

  const raw = await fs.readFile(DATA_FILE, "utf8");
  const anuncios = JSON.parse(raw);

  anuncios.unshift(nuevo);

  await fs.writeFile(DATA_FILE, JSON.stringify(anuncios, null, 2), "utf8");
  return NextResponse.json({ ok: true, id: nuevo?.id });
}
