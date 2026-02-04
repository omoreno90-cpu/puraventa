"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  actualizarAnuncio,
  esPropietario,
  obtenerAnuncioPorId,
  obtenerOwnerToken,
} from "@/lib/storage";
import { PROVINCIAS, CANTONES } from "@/lib/ubicaciones";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const COLORS = {
  navy: "#0A2540",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  danger: "#DC2626",
};

const CATEGORIAS = [
  "Muebles",
  "Electrodomésticos",
  "Tecnología",
  "Motos y vehículos",
  "Deportes & outdoor",
  "Hogar",
  "Alquiler de casas y apartamentos",
  "Otros",
] as const;

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    outline: "none",
    fontWeight: 500,
    color: COLORS.text,
  };
}

function selectStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 600,
    color: COLORS.text,
  };
}

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: `1px solid ${COLORS.navy}`,
    background: disabled ? COLORS.border : COLORS.navy,
    color: disabled ? "#7A8193" : "white",
    fontWeight: 750,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export default function EditarPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const anuncio = useMemo(() => (id ? obtenerAnuncioPorId(id) : null), [id]);
  const ownerToken = useMemo(() => obtenerOwnerToken(), []);

  const permitido = anuncio ? esPropietario(anuncio, ownerToken) : false;

  const [titulo, setTitulo] = useState(anuncio?.titulo ?? "");
  const [precio, setPrecio] = useState(String(anuncio?.precio ?? ""));
  const [provincia, setProvincia] = useState<(typeof PROVINCIAS)[number]>(
    (anuncio?.provincia as any) || "San José"
  );
  const [canton, setCanton] = useState<string>(anuncio?.canton || CANTONES["San José"][0]);
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>(
    (anuncio?.categoria as any) || "Muebles"
  );
  const [descripcion, setDescripcion] = useState(anuncio?.descripcion ?? "");
  const [whatsapp, setWhatsapp] = useState(anuncio?.whatsapp ?? "");
  const [fotos, setFotos] = useState<string[]>(anuncio?.fotos ?? []);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cantonesDisponibles = useMemo(() => CANTONES[provincia], [provincia]);

  function quitarFoto(idx: number) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onPickFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const list = Array.from(files).slice(0, 5);

    const urls = await Promise.all(
      list.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = reject;
            r.readAsDataURL(f);
          })
      )
    );
    setFotos(urls);
  }

  async function guardar() {
    setError(null);

    if (!anuncio) {
      setError("Anuncio no encontrado.");
      return;
    }
    if (!permitido) {
      setError("No puedes editar este anuncio desde este dispositivo/navegador.");
      return;
    }

    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setError("Pon un precio válido.");
      return;
    }
    if (titulo.trim().length < 5) {
      setError("El título debe tener al menos 5 caracteres.");
      return;
    }

    setGuardando(true);
    try {
      actualizarAnuncio(anuncio.id, {
        titulo: titulo.trim(),
        precio: precioNum,
        provincia,
        canton,
        categoria,
        descripcion: descripcion.trim(),
        whatsapp: whatsapp.trim(),
        fotos,
      });
      router.push(`/anuncio/${anuncio.id}`);
    } catch (e: any) {
      setError(String(e?.message || "Error guardando cambios."));
    } finally {
      setGuardando(false);
    }
  }

  if (!anuncio) {
    return (
      <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
          <Link href="/" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            ← Volver
          </Link>
          <div style={{ marginTop: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 16, background: COLORS.card }}>
            Anuncio no encontrado.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <Link href={`/anuncio/${anuncio.id}`} style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            ← Volver al anuncio
          </Link>
          <Link href="/normas" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            Normas
          </Link>
        </div>

        <div
          style={{
            marginTop: 14,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: COLORS.text }}>Editar anuncio</h1>

          {!permitido && (
            <div style={{ marginTop: 10, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, background: "#FFF5F5", color: COLORS.danger, fontWeight: 800 }}>
              No puedes editar este anuncio desde este navegador. (La edición se permite solo al creador.)
            </div>
          )}

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <input style={inputStyle()} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" />
            <input style={inputStyle()} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio (₡)" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select
                style={selectStyle()}
                value={provincia}
                onChange={(e) => {
                  const p = e.target.value as (typeof PROVINCIAS)[number];
                  setProvincia(p);
                  setCanton(CANTONES[p][0]);
                }}
              >
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select style={selectStyle()} value={canton} onChange={(e) => setCanton(e.target.value)}>
                {cantonesDisponibles.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <select style={selectStyle()} value={categoria} onChange={(e) => setCategoria(e.target.value as any)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <textarea style={{ ...inputStyle(), minHeight: 110, resize: "vertical" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />

            <input style={inputStyle()} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (opcional)" />

            <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 16, padding: 14, background: "#FBFCFF" }}>
              <div style={{ fontWeight: 800, color: COLORS.text }}>Fotos (máx. 5)</div>
              <input style={{ marginTop: 10 }} type="file" accept="image/*" multiple onChange={onPickFotos} />

              {fotos.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                  {fotos.map((src, i) => (
                    <div key={i} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", background: COLORS.card, position: "relative" }}>
                      <div style={{ height: 110, background: `url(${src}) center/cover no-repeat` }} />
                      <button
                        onClick={() => quitarFoto(i)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          borderRadius: 999,
                          border: `1px solid ${COLORS.border}`,
                          background: "rgba(255,255,255,0.95)",
                          padding: "6px 10px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div style={{ color: COLORS.danger, fontWeight: 800 }}>{error}</div>}

            <button onClick={guardar} disabled={!permitido || guardando} style={primaryBtn(!permitido || guardando)}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
