"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import type { Anuncio } from "../lib/storage";
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
  navySoft: "rgba(10,37,64,0.08)",
};

const PROVINCIAS_GAM = ["GAM", "San José", "Heredia", "Alajuela", "Cartago"] as const;
const PROVINCIAS_RESTO = ["Guanacaste", "Puntarenas", "Limón"] as const;
const GAM_SET = new Set(["San José", "Heredia", "Alajuela", "Cartago"]);

const CATEGORIAS = [
  "Todas",
  "Muebles",
  "Electrodomésticos",
  "Tecnología",
  "Motos y vehículos",
  "Deportes & outdoor",
  "Alquiler de casas y apartamentos",
  "Hogar",
  "Otros",
] as const;

type Zona = "GAM" | (typeof PROVINCIAS)[number];

function formatFechaISO(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
}

function diasDesde(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: active ? COLORS.navySoft : COLORS.card,
    color: active ? COLORS.navy : COLORS.text,
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
  };
}

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: disabled ? COLORS.border : COLORS.navy,
    color: disabled ? "#7A8193" : "white",
    fontWeight: 650,
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
    fontWeight: 600,
    cursor: "pointer",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    background: COLORS.card,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
    overflow: "hidden",
  };
}

function badgeStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: "#475569",
    fontSize: 12,
    fontWeight: 600,
  };
}

export default function HomePage() {
  const router = useRouter();

  // evita hydration mismatch (fechas)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [q, setQ] = useState("");
  const [prov, setProv] = useState<Zona>("GAM");
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number]>("Todas");
  const [mostrarResto, setMostrarResto] = useState(false);

  // filtro por ubicación (cantón/zona)
  const [ubicacion, setUbicacion] = useState<string>("Cualquiera");

  // cuando cambias provincia, resetea ubicación
  useEffect(() => {
    setUbicacion("Cualquiera");
  }, [prov]);

  const ubicacionesDisponibles = useMemo(() => {
    if (prov === "GAM") return [];
    return CANTONES[prov] ?? [];
  }, [prov]);

  // ✅ anuncios desde servidor
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // ✅ FIX: el API devuelve { ok: true, anuncios: [...] }
  async function cargarAnuncios() {
    setCargando(true);
    setErrorCarga(null);
    try {
      const res = await fetch("/api/anuncios", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar anuncios.");

      const json = (await res.json()) as { ok?: boolean; anuncios?: Anuncio[] };
      const arr = Array.isArray(json?.anuncios) ? json.anuncios : [];

      setAnuncios(arr);
    } catch (e: any) {
      setErrorCarga(e?.message || "Error cargando anuncios.");
      setAnuncios([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarAnuncios();
  }, []);

  const filtrados = useMemo(() => {
    const nq = norm(q);

    return anuncios
      .filter((a) => {
        const provA = (a.provincia || "").trim();
        // en tu UI antigua usabas canton; en API nueva se llama ciudad
        const cantonA = ((a as any).canton || (a as any).ciudad || "").trim();

        // provincia
        if (prov === "GAM") {
          if (!GAM_SET.has(provA)) return false;
        } else {
          if (provA !== prov) return false;
        }

        // ubicación (solo cuando hay provincia específica)
        if (prov !== "GAM" && ubicacion !== "Cualquiera") {
          if (cantonA !== ubicacion) return false;
        }

        // categoría (si existe en tu tipo antiguo)
        if (cat !== "Todas" && (a as any).categoria && (a as any).categoria !== cat) return false;

        // búsqueda por palabra
        if (nq) {
          const hay =
            norm((a as any).titulo || "").includes(nq) ||
            norm((a as any).descripcion || "").includes(nq) ||
            norm(cantonA).includes(nq) ||
            norm((a as any).provincia || "").includes(nq);
          if (!hay) return false;
        }

        return true;
      })
      .sort((x: any, y: any) => {
        // API nueva: createdAt. UI vieja: creadoEn.
        const a = String(y?.createdAt ?? y?.creadoEn ?? "");
        const b = String(x?.createdAt ?? x?.creadoEn ?? "");
        return a.localeCompare(b);
      });
  }, [anuncios, q, prov, cat, ubicacion]);

  const total = filtrados.length;

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "saturate(180%) blur(10px)",
          background: "rgba(248,250,252,0.85)",
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
                fontWeight: 700,
              }}
              title="PuraVenta"
            >
              PV
            </div>
            <div>
              <div style={{ fontWeight: 750, color: COLORS.text }}>PuraVenta</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Compra y vende en Costa Rica</div>
            </div>
          </div>

          <button onClick={() => router.push("/publicar")} style={primaryBtn()}>
            Publicar
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px" }}>
        <section style={{ ...cardStyle(), padding: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <div style={{ minWidth: 260 }}>
              <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, letterSpacing: -0.2, color: COLORS.text, fontWeight: 750 }}>
                Encuentra algo bueno, rápido.
              </h1>
              <div style={{ marginTop: 8, color: "#475569", fontWeight: 600 }}>
                PuraVenta no gestiona pagos. Solo te conectamos.
              </div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontSize: 13 }}>
                Consejo anti-estafa: nunca envíes dinero por adelantado.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={badgeStyle()}>✅ Gratis</span>
              <span style={badgeStyle()}>✅ Sin comisiones</span>
              <span style={badgeStyle()}>✅ Enfocado GAM</span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Busca por palabra: "bicicleta", "iPhone", "sofá"...'
              style={{
                flex: "1 1 320px",
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                outline: "none",
                fontWeight: 500,
                background: COLORS.card,
                color: COLORS.text,
              }}
            />

            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as any)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button onClick={() => router.push("/publicar")} style={primaryBtn()}>
              Publicar anuncio
            </button>

            <button onClick={cargarAnuncios} style={ghostBtn()} disabled={cargando}>
              {cargando ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#667085", marginBottom: 8 }}>
              Zona (por defecto: <b>GAM</b>)
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {PROVINCIAS_GAM.map((p) => (
                <div key={p} style={chipStyle(prov === p)} onClick={() => setProv(p as Zona)} role="button">
                  {p}
                </div>
              ))}

              <button onClick={() => setMostrarResto((v) => !v)} style={ghostBtn()}>
                {mostrarResto ? "Ocultar otras provincias" : "Ver todo Costa Rica"}
              </button>

              <button
                onClick={() => {
                  setQ("");
                  setCat("Todas");
                  setProv("GAM");
                  setMostrarResto(false);
                  setUbicacion("Cualquiera");
                }}
                style={ghostBtn()}
              >
                Limpiar
              </button>
            </div>

            {mostrarResto && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PROVINCIAS_RESTO.map((p) => (
                  <div key={p} style={chipStyle(prov === p)} onClick={() => setProv(p as Zona)} role="button">
                    {p}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#667085", marginBottom: 8 }}>
                Ubicación (cantón/zona)
              </div>

              {prov === "GAM" ? (
                <select
                  disabled
                  value="GAM"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: "#F1F5F9",
                    fontWeight: 700,
                    color: "#94A3B8",
                    width: "100%",
                    maxWidth: 420,
                    cursor: "not-allowed",
                  }}
                >
                  <option>Elige una provincia para filtrar por ubicación</option>
                </select>
              ) : (
                <select
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.card,
                    fontWeight: 700,
                    color: COLORS.text,
                    width: "100%",
                    maxWidth: 420,
                  }}
                >
                  <option value="Cualquiera">Cualquiera</option>
                  {ubicacionesDisponibles.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, color: COLORS.text }}>
            {cargando ? "Cargando anuncios..." : `${total} anuncio${total === 1 ? "" : "s"} encontrados`}
          </div>
          <div style={{ fontSize: 12, color: "#667085" }}>
            Mostrando: <b>{prov}</b> · <b>{cat}</b>
            {prov !== "GAM" && ubicacion !== "Cualquiera" ? ` · ${ubicacion}` : ""}
            {q.trim() ? ` · búsqueda: "${q.trim()}"` : ""}
          </div>
        </div>

        {errorCarga && (
          <div style={{ marginTop: 12, ...cardStyle(), padding: 14, borderColor: "#FCA5A5" as any }}>
            <div style={{ fontWeight: 800, color: "#991B1B" }}>Error</div>
            <div style={{ marginTop: 6, color: "#7F1D1D" }}>{errorCarga}</div>
            <div style={{ marginTop: 10 }}>
              <button onClick={cargarAnuncios} style={primaryBtn()}>
                Reintentar
              </button>
            </div>
          </div>
        )}

        <section style={{ marginTop: 14 }}>
          {cargando ? (
            <div style={{ ...cardStyle(), padding: 18 }}>
              <div style={{ fontWeight: 700, color: COLORS.text }}>Cargando…</div>
              <div style={{ marginTop: 6, color: "#667085" }}>Un momento.</div>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ ...cardStyle(), padding: 18 }}>
              <div style={{ fontWeight: 700, color: COLORS.text }}>No hay anuncios con esos filtros.</div>
              <div style={{ marginTop: 6, color: "#667085" }}>Prueba otra palabra o cambia zona/categoría/ubicación.</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => router.push("/publicar")} style={primaryBtn()}>
                  Publicar el primero
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {filtrados.map((a) => (
                <AnuncioCard key={(a as any).id} anuncio={a as any} mounted={mounted} onOpen={() => router.push(`/anuncio/${(a as any).id}`)} />
              ))}
            </div>
          )}
        </section>

        <footer style={{ marginTop: 28, color: "#667085", fontSize: 12 }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>© {new Date().getFullYear()} PuraVenta</span>
            <span>•</span>
            <span>PuraVenta no gestiona pagos. Solo te conectamos.</span>
            <span>•</span>
            <span>Consejo anti-estafa: nunca envíes dinero por adelantado.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function AnuncioCard({
  anuncio,
  onOpen,
  mounted,
}: {
  anuncio: any;
  onOpen: () => void;
  mounted: boolean;
}) {
  const foto = anuncio.fotos?.[0] || "";

  const iso = anuncio.createdAt ?? anuncio.creadoEn;
  const days = mounted ? diasDesde(iso) : null;
  const label =
    !mounted || days === null ? "" : days === 0 ? "Hoy" : `Hace ${clamp(days, 1, 999)} día${days === 1 ? "" : "s"}`;

  return (
    <div
      onClick={onOpen}
      role="button"
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        background: COLORS.card,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          height: 160,
          background: foto ? `url(${foto}) center/cover no-repeat` : "linear-gradient(135deg, #EEF2FF, #F8FAFC)",
          borderBottom: `1px solid ${COLORS.border}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            border: `1px solid ${COLORS.border}`,
            fontSize: 12,
            fontWeight: 650,
            color: COLORS.navy,
          }}
        >
          ₡{Number(anuncio.precio || 0).toLocaleString("es-CR")}
        </div>

        {label && (
          <div
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              border: `1px solid ${COLORS.border}`,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {label}
          </div>
        )}
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 6, lineHeight: 1.2 }}>
          {anuncio.titulo}
        </div>
        <div style={{ fontSize: 12, color: COLORS.subtext, fontWeight: 600 }}>
          {(anuncio.canton ?? anuncio.ciudad ?? "—")}, {anuncio.provincia}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: COLORS.muted }}>
          Publicado: {mounted ? formatFechaISO(iso) : "—"}
        </div>
      </div>
    </div>
  );
}
