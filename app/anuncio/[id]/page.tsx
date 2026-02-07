"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Inter } from "next/font/google";

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

type ApiAnuncio = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  provincia?: string;
  ciudad?: string; // API nueva
  canton?: string; // por compat
  whatsapp?: string;
  telefono?: string;
  fotos?: string[];
  createdAt?: string; // API nueva
  creadoEn?: string;  // por compat
  categoria?: string;
  subcategoria?: string;
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    background: COLORS.card,
    boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
    overflow: "hidden",
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 800,
    cursor: "pointer",
    color: COLORS.text,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

function primaryBtn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.navy}`,
    background: COLORS.navy,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

function successBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid #86EFAC`,
    background: disabled ? "#E5E7EB" : "#DCFCE7",
    color: disabled ? "#6B7280" : "#166534",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

function formatFecha(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR");
}

export default function AnuncioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const [anuncio, setAnuncio] = useState<ApiAnuncio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error || "No se pudo cargar el anuncio.");
        }

        // API esperada: { ok: true, anuncio: {...} }
        const a = (json?.anuncio ?? json) as ApiAnuncio;

        if (!a || !a.id) {
          throw new Error("Anuncio no encontrado.");
        }

        if (!cancel) setAnuncio(a);
      } catch (e: any) {
        if (!cancel) {
          setError(e?.message || "Error cargando el anuncio.");
          setAnuncio(null);
        }
      } finally {
        if (!cancel) setCargando(false);
      }
    }

    if (id) cargar();

    return () => {
      cancel = true;
    };
  }, [id]);

  const view = useMemo(() => {
    const a = anuncio;
    if (!a) return null;

    const titulo = (a.titulo || "").trim() || "Sin título";
    const precio = typeof a.precio === "number" ? a.precio : 0;
    const provincia = (a.provincia || "").trim();
    const ciudad = ((a.ciudad ?? a.canton) || "").trim();
    const descripcion = (a.descripcion || "").trim() || "—";
    const fotos = Array.isArray(a.fotos) ? a.fotos.filter(Boolean) : [];
    const whatsapp = (a.whatsapp || "").trim();
    const created = a.createdAt ?? a.creadoEn;

    return { titulo, precio, provincia, ciudad, descripcion, fotos, whatsapp, created, id: a.id };
  }, [anuncio]);

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(248,250,252,0.92)",
          backdropFilter: "saturate(180%) blur(10px)",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: COLORS.navy,
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 900,
              }}
              title="PuraVenta"
            >
              PV
            </div>
            <div>
              <div style={{ fontWeight: 900, color: COLORS.text }}>PuraVenta</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                Personas reales · Sin comisiones · Seguro
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => router.push("/")} style={ghostBtn()}>
              Volver
            </button>
            <Link href="/publicar" style={primaryBtn()}>
              Publicar
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px" }}>
        {cargando ? (
          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ fontWeight: 900, color: COLORS.text }}>Cargando…</div>
            <div style={{ marginTop: 6, color: "#667085" }}>Un momento.</div>
          </div>
        ) : error ? (
          <div style={{ ...cardStyle(), padding: 18, borderColor: "#FCA5A5" as any }}>
            <div style={{ fontWeight: 900, color: "#991B1B" }}>Error</div>
            <div style={{ marginTop: 6, color: "#7F1D1D" }}>{error}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => router.push("/")} style={ghostBtn()}>
                Volver a home
              </button>
            </div>
          </div>
        ) : !view ? null : (
          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 950, fontSize: 24, color: COLORS.text, lineHeight: 1.2 }}>
                  {view.titulo}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontWeight: 950, fontSize: 20, color: COLORS.text }}>
                    ₡{Number(view.precio || 0).toLocaleString("es-CR")}
                  </span>

                  <span style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>
                    {view.ciudad ? `${view.ciudad}, ` : ""}{view.provincia || "—"}
                  </span>

                  <span style={{ fontSize: 12, color: COLORS.muted }}>
                    Publicado: {formatFecha(view.created)}
                  </span>

                  <span style={{ fontSize: 12, color: COLORS.muted }}>ID: {view.id}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href={view.whatsapp ? `https://wa.me/506${encodeURIComponent(view.whatsapp)}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={successBtn(!view.whatsapp)}
                  onClick={(e) => {
                    if (!view.whatsapp) e.preventDefault();
                  }}
                >
                  WhatsApp {view.whatsapp ? view.whatsapp : "(no disponible)"}
                </a>

                <Link href={`/editar/${view.id}`} style={primaryBtn()}>
                  Editar
                </Link>
              </div>
            </div>

            <div style={{ marginTop: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 950, color: COLORS.text, marginBottom: 8 }}>Fotos</div>

                  {view.fotos.length === 0 ? (
                    <div style={{ color: COLORS.subtext, fontWeight: 700 }}>
                      Este anuncio no tiene fotos.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {view.fotos.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 16,
                            overflow: "hidden",
                            background: "#fff",
                            display: "block",
                            textDecoration: "none",
                          }}
                          title="Abrir foto"
                        >
                          <div style={{ height: 160, background: `url(${src}) center/cover no-repeat` }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 950, color: COLORS.text, marginBottom: 8 }}>Descripción</div>
                  <div style={{ color: COLORS.subtext, fontWeight: 650, whiteSpace: "pre-wrap" }}>
                    {view.descripcion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
