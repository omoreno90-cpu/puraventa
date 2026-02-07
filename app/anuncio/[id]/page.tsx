"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  navySoft: "rgba(10,37,64,0.08)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    background: COLORS.card,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
    overflow: "hidden",
  };
}

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: disabled ? COLORS.border : COLORS.navy,
    color: disabled ? "#7A8193" : "white",
    fontWeight: 850,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    fontWeight: 750,
    cursor: "pointer",
  };
}

function badgeStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.92)",
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
}

function formatFechaISO(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function isSi(v: any) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "si" || s === "sí" || s === "true" || s === "1";
}

type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad?: string;
  canton?: string;
  whatsapp?: string;
  fotos?: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt?: string;
  creadoEn?: string;

  // 🚗 extras vehículos (opcionales)
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

export default function AnuncioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/anuncios/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "No se pudo cargar el anuncio.");
      const a = (json?.anuncio ?? json) as Anuncio;
      if (!a?.id) throw new Error("Anuncio no encontrado.");
      setAnuncio(a);
    } catch (e: any) {
      setError(e?.message || "Error cargando anuncio.");
      setAnuncio(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ciudadLabel = useMemo(() => {
    if (!anuncio) return "—";
    return (anuncio.canton ?? anuncio.ciudad ?? "—").toString();
  }, [anuncio]);

  const createdLabel = useMemo(() => {
    if (!anuncio) return "—";
    return formatFechaISO(anuncio.createdAt ?? anuncio.creadoEn);
  }, [anuncio]);

  const ws = useMemo(() => {
    if (!anuncio?.whatsapp) return "";
    return onlyDigits(anuncio.whatsapp);
  }, [anuncio]);

  const esVehiculos = useMemo(() => {
    const cat = String(anuncio?.categoria ?? "").toLowerCase();
    // cubre tildes raras etc.
    return cat.includes("motos") || cat.includes("veh");
  }, [anuncio]);

  const tieneInfoVehiculo = useMemo(() => {
    if (!anuncio) return false;
    return (
      anuncio.vehiculoAno !== undefined ||
      anuncio.marchamoAlDia !== undefined ||
      anuncio.dekraAlDia !== undefined ||
      (anuncio.dekraMes ?? "").trim().length > 0
    );
  }, [anuncio]);

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/")} style={ghostBtn()}>
            ← Volver
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {ws ? (
              <a
                href={`https://wa.me/${ws}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...badgeStyle(),
                  borderColor: "#86EFAC",
                  color: "#14532D",
                  background: "rgba(134,239,172,0.30)",
                  textDecoration: "none",
                }}
              >
                WhatsApp {ws}
              </a>
            ) : (
              <span style={{ ...badgeStyle(), color: COLORS.muted }}>WhatsApp (no disponible)</span>
            )}

            {anuncio?.id ? (
              <button onClick={() => router.push(`/editar/${anuncio.id}`)} style={primaryBtn()}>
                Editar
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 14, ...cardStyle(), padding: 20 }}>
          {cargando ? (
            <div style={{ fontWeight: 800, color: COLORS.text }}>Cargando…</div>
          ) : error ? (
            <>
              <div style={{ fontWeight: 900, color: COLORS.danger }}>Error</div>
              <div style={{ marginTop: 6, color: "#7F1D1D", fontWeight: 700 }}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={cargar} style={primaryBtn()}>
                  Reintentar
                </button>
              </div>
            </>
          ) : !anuncio ? (
            <div style={{ fontWeight: 900, color: COLORS.text }}>Anuncio no encontrado.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: -0.4, color: COLORS.text }}>{anuncio.titulo}</div>
                  <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 700, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 20, fontWeight: 950, color: COLORS.text }}>₡{Number(anuncio.precio || 0).toLocaleString("es-CR")}</span>
                    <span>·</span>
                    <span>
                      {ciudadLabel}, {anuncio.provincia}
                    </span>
                    <span>·</span>
                    <span>Publicado: {createdLabel}</span>
                    <span>·</span>
                    <span style={{ color: COLORS.muted }}>ID: {anuncio.id}</span>
                  </div>
                </div>
              </div>

              {/* ✅ Bloque vehículos (DEKRA/marchamo/año) */}
              {esVehiculos && tieneInfoVehiculo && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background: "#FBFCFF",
                  }}
                >
                  <div style={{ fontWeight: 950, color: COLORS.text, marginBottom: 10 }}>Detalles del vehículo</div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {anuncio.vehiculoAno !== undefined && (
                      <div style={badgeStyle()}>
                        <span style={{ color: COLORS.subtext, fontWeight: 900 }}>Año:</span> {anuncio.vehiculoAno}
                      </div>
                    )}

                    {anuncio.marchamoAlDia !== undefined && (
                      <div style={badgeStyle()}>
                        <span style={{ color: COLORS.subtext, fontWeight: 900 }}>Marchamo:</span>{" "}
                        {isSi(anuncio.marchamoAlDia) ? "Al día" : "No al día"}
                      </div>
                    )}

                    {anuncio.dekraAlDia !== undefined && (
                      <div style={badgeStyle()}>
                        <span style={{ color: COLORS.subtext, fontWeight: 900 }}>DEKRA:</span>{" "}
                        {isSi(anuncio.dekraAlDia) ? "Al día" : "No al día"}
                      </div>
                    )}

                    {(anuncio.dekraMes ?? "").trim() && (
                      <div style={badgeStyle()}>
                        <span style={{ color: COLORS.subtext, fontWeight: 900 }}>Mes DEKRA:</span> {String(anuncio.dekraMes)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                <div style={{ ...cardStyle(), padding: 16 }}>
                  <div style={{ fontWeight: 950, color: COLORS.text, marginBottom: 10 }}>Fotos</div>
                  {anuncio.fotos?.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      {anuncio.fotos.map((src, i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: 16,
                            border: `1px solid ${COLORS.border}`,
                            overflow: "hidden",
                            background: COLORS.card,
                            height: 220,
                          }}
                        >
                          <div style={{ height: "100%", background: `url(${src}) center/cover no-repeat` }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: COLORS.subtext, fontWeight: 700 }}>Este anuncio no tiene fotos.</div>
                  )}
                </div>

                <div style={{ ...cardStyle(), padding: 16 }}>
                  <div style={{ fontWeight: 950, color: COLORS.text, marginBottom: 10 }}>Descripción</div>
                  <div style={{ color: COLORS.text, fontWeight: 700, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {anuncio.descripcion || "—"}
                  </div>

                  {(anuncio.categoria || anuncio.subcategoria) && (
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {anuncio.categoria ? (
                        <div style={{ ...badgeStyle(), background: COLORS.navySoft, color: COLORS.navy }}>
                          Categoría: {anuncio.categoria}
                        </div>
                      ) : null}
                      {anuncio.subcategoria ? (
                        <div style={{ ...badgeStyle(), background: COLORS.navySoft, color: COLORS.navy }}>
                          Subcategoría: {anuncio.subcategoria}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div style={{ marginTop: 16, fontSize: 12, color: COLORS.muted, fontWeight: 700 }}>
                    Consejo anti-estafa: nunca envíes dinero por adelantado. Queda en persona.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
