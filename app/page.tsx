"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

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

function card(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
  };
}

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
  };
}

export default function HomePage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/anuncios", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Error cargando anuncios");

      const arr = Array.isArray(data?.anuncios) ? data.anuncios : [];
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

  return (
    <main style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 950, color: COLORS.text, lineHeight: 1.1 }}>PuraVenta</div>
            <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800 }}>
              Personas reales · Sin comisiones · Seguro
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/publicar" style={btnPrimary()}>
              Publicar
            </Link>
            <button onClick={load} style={btnGhost()}>
              Recargar
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <div style={card()}>
              <div style={{ fontWeight: 900, color: COLORS.text }}>Cargando…</div>
            </div>
          ) : error ? (
            <div style={{ ...card(), borderColor: "#FCA5A5" as any }}>
              <div style={{ fontWeight: 950, color: COLORS.danger }}>Error</div>
              <div style={{ marginTop: 6, color: "#7F1D1D", fontWeight: 900 }}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={load} style={btnPrimary()}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : anuncios.length === 0 ? (
            <div style={card()}>
              <div style={{ fontWeight: 950, color: COLORS.text }}>No hay anuncios todavía.</div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800 }}>
                Publica el primero desde “Publicar”.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {anuncios.map((a) => {
                const img = Array.isArray(a.fotos) && a.fotos.length > 0 ? a.fotos[0] : null;
                const lugar = (a.canton || a.ciudad || "—") + ", " + (a.provincia || "—");
                return (
                  <Link
                    key={a.id}
                    href={`/anuncio/${a.id}`}
                    style={{
                      ...card(),
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                      overflow: "hidden",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        height: 160,
                        background: img ? `url(${img}) center/cover no-repeat` : "#EEF2FF",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    />
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 18, fontWeight: 950, color: COLORS.text, lineHeight: 1.1 }}>
                        {a.titulo || "Sin título"}
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 950, color: COLORS.text }}>
                        ₡{Number(a.precio || 0).toLocaleString("es-CR")}
                      </div>
                      <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 850 }}>{lugar}</div>
                      <div style={{ marginTop: 8, color: COLORS.muted, fontWeight: 850, fontSize: 12 }}>
                        {a.categoria || "—"} {a.subcategoria ? `· ${a.subcategoria}` : ""}
                      </div>
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
