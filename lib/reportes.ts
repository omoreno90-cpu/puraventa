export type Reporte = {
  id: string;
  anuncioId: string;
  motivo: "estafa" | "sexo" | "animales" | "ilegal" | "spam" | "otro";
  detalle?: string;
  creadoEn: string;
};

const KEY = "puraventa_reportes_v1";

function leer(): Reporte[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Reporte[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function escribir(lista: Reporte[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lista));
}

export function guardarReporte(input: Omit<Reporte, "id" | "creadoEn">) {
  const actuales = leer();
  const rep: Reporte = {
    id: crypto.randomUUID(),
    creadoEn: new Date().toISOString(),
    ...input,
  };
  escribir([rep, ...actuales]);
}

export function obtenerReportes(): Reporte[] {
  return leer();
}
