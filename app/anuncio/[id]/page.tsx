"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Anuncio } from "@/lib/storage";

const COLORS = {
  navy: "#0A2540",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    background: COLORS.card,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
    overflow: "hidden",
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: COLORS.navy,
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    fontWeight: 800,
    cursor: "pointer",
  };
}

// Verde WhatsApp “real”
function btnWhatsApp(): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #16A34A",
    background: "#22C55E",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  };
}

function formatCRC(n: number) {
  try {
    return "₡" + Number(n || 0).toLocaleString("es-CR");
  } catch {
    return "₡" + String(n ?? "");
  }
}

function cleanPhone(p: string) {
  return (p || "").replace(/[^\d]/g, "");
}

export default function AnuncioPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg("");
      setAnuncio(null);

      try {
        const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) setErrorMsg(data?.error || "No se pudo cargar");
          return;
        }

        if (!cancelled) setAnuncio(data as Anuncio);
      } catch (e: any) {
        if (!cancelled) setErrorMsg("No se pudo cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const fotos = useMemo(() => {
    const arr = anuncio?.fotos || [];
    return Array.isArray(arr) ? arr : [];
  }, [anuncio]);

  const wa = useMemo(() => {
    const phone = cleanPhone(anuncio?.whatsapp || "");
    if (!phone) return "";
    const text = encodeURIComponent(`Hola, vi tu anuncio en PuraVenta: "${anuncio?.titulo || ""}". ¿Sigue disponible?`);
    // Costa Rica: normalmente +506 (si ya viene con 506, lo dejamos)
    const full = phone.startsWith("506") ? phone : "506" + phone;
    return `https://wa.me/${full}?text=${text}`;
  }, [anuncio]);

  return (
    <main style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(248,250,252,0.9)",
          backdropFilter: "blur(10px)",
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
            gap: 10,
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
            >
              PV
            </div>
            <div>
              <div style={{ fontWeight: 900, color: COLORS.text }}>PuraVenta</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Personas reales · Sin comisiones · Seguro</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/")} style={btnGhost()}>
              Volver
            </button>
            <button onClick={() => router.push("/publicar")} style={btnPrimary()}>
              Publicar
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 16px 60px" }}>
        {loading ? (
          <section style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ fontWeight: 900, color: COLORS.text }}>Cargando…</div>
            <div style={{ marginTop: 6, color: COLORS.subtext }}>Un segundo.</div>
          </section>
        ) : errorMsg ? (
          <section style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ fontWeight: 900, color: "#B91C1C", fontSize: 22 }}>No se pudo cargar</div>
            <div style={{ marginTop: 6, color: COLORS.subtext }}>{errorMsg}</div>
            <div style={{ marginTop: 14 }}>
              <button onClick={() => router.push("/")} style={btnPrimary()}>
                Ir a inicio
              </button>
            </div>

            {/* Debug útil SIN romper estética */}
            <div style={{ marginTop: 14, fontSize: 12, color: COLORS.muted }}>
              Debug: id = <b>{id}</b>
            </div>
          </section>
        ) : !anuncio ? (
          <section style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ fontWeight: 900, color: "#B91C1C", fontSize: 22 }}>No se pudo cargar</div>
            <div style={{ marginTop: 6, color: COLORS.subtext }}>No existe</div>
            <div style={{ marginTop: 14 }}>
              <button onClick={() => router.push("/")} style={btnPrimary()}>
                Ir a inicio
              </button>
            </div>
          </section>
        ) : (
          <section style={{ ...cardStyle() }}>
            <div
              style={{
                borderBottom: `1px solid ${COLORS.border}`,
                padding: 18,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 900, fontSize: 24, color: COLORS.text, lineHeight: 1.15 }}>{anuncio.titulo}</div>
                <div style={{ marginTop: 8, fontWeight: 900, color: COLORS.navy, fontSize: 22 }}>{formatCRC(anuncio.precio)}</div>
                <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800 }}>
                  {anuncio.canton}, {anuncio.provincia} · {anuncio.categoria}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {wa ? (
                  <a href={wa} target="_blank" rel="noreferrer" style={btnWhatsApp()}>
                    WhatsApp
                    <span style={{ fontSize: 14, opacity: 0.95 }}>{cleanPhone(anuncio.whatsapp)}</span>
                  </a>
                ) : (
                  <button style={{ ...btnWhatsApp(), opacity: 0.5, cursor: "not-allowed" }} disabled>
                    WhatsApp (no disponible)
                  </button>
                )}
                <button onClick={() => router.push(`/editar/${anuncio.id}`)} style={btnPrimary()}>
                  Editar
                </button>
              </div>
            </div>

            <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 900, color: COLORS.text, marginBottom: 10 }}>Fotos</div>
                {fotos.length === 0 ? (
                  <div style={{ color: COLORS.subtext, fontWeight: 700 }}>Este anuncio no tiene fotos.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {fotos.map((src, i) => (
                      <div
                        key={`${anuncio.id}-${i}`}
                        style={{
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 16,
                          overflow: "hidden",
                          background: "#F1F5F9",
                          height: 160,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 900, color: COLORS.text, marginBottom: 10 }}>Descripción</div>
                <div style={{ color: COLORS.text, fontWeight: 700, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {anuncio.descripcion || "—"}
                </div>

                <div style={{ marginTop: 14, fontSize: 12, color: COLORS.muted }}>
                  ID: <b>{anuncio.id}</b>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
