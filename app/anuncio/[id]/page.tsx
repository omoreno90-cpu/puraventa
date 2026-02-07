"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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

  // coches/motos
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
  danger: "#DC2626",
  success: "#16A34A",
};

function card(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
  };
}

function btn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    color: COLORS.text,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: COLORS.navy,
    fontWeight: 950,
    cursor: "pointer",
    textDecoration: "none",
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

export default function AnuncioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Anuncio no encontrado");

      setAnuncio(data?.anuncio || null);
    } catch (e: any) {
      setAnuncio(null);
      setError(e?.message || "Anuncio no encontrado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ws = anuncio?.whatsapp ? String(anuncio.whatsapp).replace(/\D/g, "") : "";
  const waHref = ws ? `https://wa.me/506${ws}` : "";

  const esVehiculo = (anuncio?.categoria || "").toLowerCase().includes("motos") || (anuncio?.categoria || "").toLowerCase().includes("veh");

  return (
    <main style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "22px 16px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => router.push("/")} style={btn()} type="button">
            ← Volver
          </button>

          {waHref ? (
            <a href={waHref} target="_blank" rel="noreferrer" style={{ ...btnPrimary(), background: "#16A34A", borderColor: "#16A34A" }}>
              WhatsApp {ws}
            </a>
          ) : (
            <span style={{ ...btn(), cursor: "default", color: COLORS.subtext }}>WhatsApp (no disponible)</span>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div style={card()}>Cargando…</div>
          ) : error ? (
            <div style={{ ...card(), borderColor: "#FCA5A5" as any }}>
              <div style={{ fontWeight: 950, color: COLORS.danger }}>Error</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: COLORS.text }}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={load} style={btnPrimary()} type="button">
                  Reintentar
                </button>
              </div>
            </div>
          ) : !anuncio ? (
            <div style={card()}>Anuncio no encontrado.</div>
          ) : (
            <div style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 950, color: COLORS.text }}>{anuncio.titulo}</div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: COLORS.text }}>
                    ₡{Number(anuncio.precio || 0).toLocaleString("es-CR")}
                  </div>
                  <div style={{ marginTop: 8, color: COLORS.subtext, fontWeight: 900 }}>
                    {(anuncio.canton || anuncio.ciudad || "—")}, {anuncio.provincia || "—"}
                    {anuncio.categoria ? ` · ${anuncio.categoria}` : ""}
                    {anuncio.subcategoria ? ` · ${anuncio.subcategoria}` : ""}
                  </div>
                  <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800, fontSize: 13 }}>
                    ID: <span style={{ fontWeight: 950 }}>{anuncio.id}</span>
                  </div>
                </div>

                <Link href={`/editar/${encodeURIComponent(anuncio.id)}`} style={btnPrimary()}>
                  Editar
                </Link>
              </div>

              <hr style={{ border: 0, borderTop: `1px solid ${COLORS.border}`, margin: "16px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 950, color: COLORS.text, fontSize: 16 }}>Fotos</div>
                  {anuncio.fotos && anuncio.fotos.length > 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{
                          height: 260,
                          borderRadius: 14,
                          border: `1px solid ${COLORS.border}`,
                          background: `url(${anuncio.fotos[0]}) center/cover no-repeat`,
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, color: COLORS.subtext, fontWeight: 850 }}>Este anuncio no tiene fotos.</div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 950, color: COLORS.text, fontSize: 16 }}>Descripción</div>
                  <div style={{ marginTop: 8, color: COLORS.text, fontWeight: 800, whiteSpace: "pre-wrap" }}>
                    {anuncio.descripcion || "—"}
                  </div>

                  {/* ✅ Aquí mostramos DEKRA/Marchamo si aplica */}
                  {esVehiculo && (
                    <div style={{ marginTop: 14, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, background: "#FBFCFF" }}>
                      <div style={{ fontWeight: 950, color: COLORS.text }}>Datos del vehículo</div>

                      <div style={{ marginTop: 8, display: "grid", gap: 6, color: COLORS.text, fontWeight: 850 }}>
                        <div>Año: <b>{anuncio.vehiculoAno ?? "—"}</b></div>
                        <div>Marchamo al día: <b>{anuncio.marchamoAlDia === true ? "Sí" : anuncio.marchamoAlDia === false ? "No" : "—"}</b></div>
                        <div>DEKRA al día: <b>{anuncio.dekraAlDia === true ? "Sí" : anuncio.dekraAlDia === false ? "No" : "—"}</b></div>
                        <div>Mes DEKRA: <b>{anuncio.dekraMes || "—"}</b></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
