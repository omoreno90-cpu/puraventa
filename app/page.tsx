"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  canton?: string;
  ciudad?: string;
  whatsapp?: string;
  fotos?: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt?: string;
  updatedAt?: string;
  // campos coches
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

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

function btnPrimary(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: COLORS.navy,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
  };
}

function pill(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}

function card(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
  };
}

export default function HomePage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // extras “home”
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/anuncios", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error cargando anuncios");

      const arr = Array.isArray(data?.anuncios) ? (data.anuncios as Anuncio[]) : [];
      setAnuncios(arr);
    } catch (e: any) {
      setError(e?.message || "Error");
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    for (const a of anuncios) if (a.categoria) s.add(a.categoria);
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [anuncios]);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return anuncios.filter((a) => {
      if (cat && (a.categoria || "") !== cat) return false;
      if (!qq) return true;
      const hay =
        (a.titulo || "").toLowerCase().includes(qq) ||
        (a.descripcion || "").toLowerCase().includes(qq) ||
        (a.subcategoria || "").toLowerCase().includes(qq) ||
        (a.categoria || "").toLowerCase().includes(qq) ||
        (a.provincia || "").toLowerCase().includes(qq) ||
        (a.canton || a.ciudad || "").toLowerCase().includes(qq);
      return hay;
    });
  }, [anuncios, q, cat]);

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* Top bar (como tu estilo) */}
      <div
        style={{
          background: "white",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: COLORS.navy,
                color: "white",
                fontWeight: 950,
                display: "grid",
                placeItems: "center",
              }}
            >
              PV
            </div>
            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontSize: 20, fontWeight: 950, color: COLORS.text }}>PuraVenta</div>
              <div style={{ marginTop: 4, color: COLORS.subtext, fontWeight: 800, fontSize: 13 }}>
                Personas reales · Sin comisiones · Seguro
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={load} style={btnGhost()} type="button">
              Recargar
            </button>
            <Link href="/publicar" style={btnPrimary()}>
              Publicar
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 16px 60px" }}>
        {/* Normas pills */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={pill()}>⛔ No animales</span>
            <span style={pill()}>⛔ No sexo</span>
            <span style={pill()}>⛔ No estafas</span>
            <span style={pill()}>⛔ Ilegal/armas/drogas</span>
          </div>
          <Link href="/normas" style={{ color: COLORS.navy, fontWeight: 950, textDecoration: "none" }}>
            Ver normas →
          </Link>
        </div>

        {/* Buscador + filtro */}
        <div
          style={{
            marginTop: 14,
            ...card(),
            padding: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (título, descripción, zona, subcategoría...)"
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                background: "white",
                outline: "none",
                fontWeight: 800,
                color: COLORS.text,
              }}
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                background: "white",
                fontWeight: 900,
                color: COLORS.text,
              }}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10, color: COLORS.subtext, fontWeight: 800, fontSize: 13 }}>
            {loading ? "Cargando…" : `${filtrados.length} anuncio(s)`}
            {anuncios.length === 1 ? " (si solo tienes 1 en Redis, aquí verás 1)" : ""}
          </div>
        </div>

        {/* Listado */}
        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div style={{ ...card(), padding: 16, fontWeight: 950, color: COLORS.text }}>Cargando…</div>
          ) : error ? (
            <div style={{ ...card(), padding: 16, borderColor: "#FCA5A5" as any }}>
              <div style={{ fontWeight: 950, color: COLORS.danger }}>Error</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: "#7F1D1D" }}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={load} style={btnPrimary()} type="button">
                  Reintentar
                </button>
              </div>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ ...card(), padding: 16 }}>
              <div style={{ fontWeight: 950, color: COLORS.text }}>No hay anuncios con esos filtros.</div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800 }}>Prueba a quitar la categoría o el texto.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {filtrados.map((a) => {
                const img = Array.isArray(a.fotos) && a.fotos.length > 0 ? a.fotos[0] : null;
                const lugar = `${a.canton || a.ciudad || "—"}, ${a.provincia || "—"}`;

                return (
                  <Link
                    key={a.id}
                    href={`/anuncio/${a.id}`}
                    style={{ ...card(), display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        height: 170,
                        background: img ? `url(${img}) center/cover no-repeat` : "#EEF2FF",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    />
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 18, fontWeight: 950, color: COLORS.text, lineHeight: 1.15 }}>
                        {a.titulo || "Sin título"}
                      </div>

                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950, color: COLORS.text }}>
                          ₡{Number(a.precio || 0).toLocaleString("es-CR")}
                        </div>
                        <div style={{ color: COLORS.subtext, fontWeight: 900, fontSize: 12 }}>
                          {a.categoria || "—"}
                          {a.subcategoria ? ` · ${a.subcategoria}` : ""}
                        </div>
                      </div>

                      <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 850 }}>{lugar}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
