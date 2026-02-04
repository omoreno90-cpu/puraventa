export type Anuncio = {
  id: string;
  titulo: string;
  precio: number;
  provincia: string;
  canton: string;
  categoria: string;
  descripcion: string;
  whatsapp: string;
  fotos: string[];
  creadoEn: string;

  // ✅ para edición por propietario (sin cuentas)
  ownerToken?: string;

  // opcional para futuro
  actualizadoEn?: string;
};

const KEY = "puraventa_anuncios_v2";
const TTL_DIAS = 30;

function nowIso() {
  return new Date().toISOString();
}

function diasDesde(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 9999;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function limpiarVencidos(lista: Anuncio[]) {
  return lista.filter((a) => diasDesde(a.creadoEn) <= TTL_DIAS);
}

function leer(): Anuncio[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Anuncio[];
    if (!Array.isArray(data)) return [];
    return limpiarVencidos(data);
  } catch {
    return [];
  }
}

function escribir(lista: Anuncio[]) {
  if (typeof window === "undefined") return;

  const limpios = limpiarVencidos(lista);

  try {
    localStorage.setItem(KEY, JSON.stringify(limpios));
    return;
  } catch (e: any) {
    // Si el error es cuota (fotos grandes), lanzamos un mensaje claro
    const name = String(e?.name || "");
    const msg = String(e?.message || "");
    const esQuota =
      name.includes("Quota") ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("exceeded");

    if (esQuota) {
      throw new Error(
        "No hay espacio para guardar el anuncio (fotos demasiado grandes). Borra anuncios antiguos o sube fotos más ligeras."
      );
    }

    throw e;
  }
}

export function obtenerAnuncios(): Anuncio[] {
  return leer().sort((a, b) => String(b.creadoEn).localeCompare(String(a.creadoEn)));
}

export function obtenerAnuncioPorId(id: string): Anuncio | null {
  return leer().find((a) => a.id === id) ?? null;
}

// ✅ token de propietario guardado en el navegador del creador
const OWNER_KEY = "puraventa_owner_token";

export function obtenerOwnerToken(): string {
  if (typeof window === "undefined") return "server";
  let t = localStorage.getItem(OWNER_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, t);
  }
  return t;
}

export function esPropietario(anuncio: Anuncio, ownerToken: string): boolean {
  return Boolean(anuncio.ownerToken && anuncio.ownerToken === ownerToken);
}

export function guardarAnuncio(anuncio: Anuncio): void {
  const actuales = leer();
  const nuevos = [anuncio, ...actuales];
  escribir(nuevos);
}

export function actualizarAnuncio(id: string, patch: Partial<Anuncio>): void {
  const lista = leer();
  const idx = lista.findIndex((a) => a.id === id);
  if (idx < 0) throw new Error("No se encontró el anuncio.");

  lista[idx] = {
    ...lista[idx],
    ...patch,
    actualizadoEn: nowIso(),
  };

  escribir(lista);
}

export function eliminarAnuncio(id: string): void {
  const lista = leer().filter((a) => a.id !== id);
  escribir(lista);
}
