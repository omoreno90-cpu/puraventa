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

  // 🚗 vehículos
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
  success: "#16A34A",
  warn: "#F59E0B",
  soft: "#EEF2FF",
};

function btnPrimary(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.navy}`,
    background: COLORS.navy,
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    userSelect: "none",
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
    userSelect: "none",
  };
}

function btnSoft(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: "#F1F5F9",
    color: COLORS.text,
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    userSelect: "none",
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

function chip(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? COLORS.navy : COLORS.border}`,
    background: active ? COLORS.navy : COLORS.card,
    color: active ? "white" : COLORS.text,
    fontWeight: 950,
    fontSize: 12,
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
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

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    outline: "none",
    fontWeight: 800,
    color: COLORS.text,
    width: "100%",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    fontWeight: 900,
    color: COLORS.text,
    width: "100%",
  };
}

function formatCRC(n: number) {
  const v = Number(n || 0);
  try {
    return `₡${v.toLocaleString("es-CR")}`;
  } catch {
    return `₡${v}`;
  }
}

function safeStr(x: any) {
  return String(x ?? "").trim();
}

function normalizeLower(x: any) {
  return safeStr(x).toLowerCase();
}

type SortMode = "recientes" | "precio_asc" | "precio_desc";

export default function HomePage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [subcat, setSubcat] = useState<string>("");
  const [prov, setProv] = useState<string>("");
  const [soloConFotos, setSoloConFotos] = useState<boolean>(false);
  const [sort, setSort] = useState<SortMode>("recientes");

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

  // opciones dinámicas (a partir de tus anuncios reales)
  const provincias = useMemo(() => {
    const s = new Set<string>();
    for (const a of anuncios) {
      const p = safeStr(a.provincia);
      if (p) s.add(p);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [anuncios]);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    for (const a of anuncios) {
      const c = safeStr(a.categoria);
      if (c) s.add(c);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [anuncios]);

  const subcategorias = useMemo(() => {
    // subcats disponibles según cat actual (si no hay cat, usamos todas)
    const s = new Set<string>();
    for (const a of anuncios) {
      const c = safeStr(a.categoria);
      const sc = safeStr(a.subcategoria);
      if (!sc) continue;
      if (cat && c !== cat) continue;
      s.add(sc);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [anuncios, cat]);

  // si cambias de categoría, y la subcategoría ya no existe, la reseteamos
  useEffect(() => {
    if (!subcat) return;
    if (subcategorias.includes(subcat)) return;
    setSubcat("");
  }, [subcategorias, subcat]);

  const chipsCategorias = useMemo(() => {
    // top 6 por frecuencia
    const counts = new Map<string, number>();
    for (const a of anuncios) {
      const c = safeStr(a.categoria);
      if (!c) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const arr = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([c]) => c);
    return arr;
  }, [anuncios]);

  const filtrados = useMemo(() => {
    const qq = normalizeLower(q);
    const wantCat = safeStr(cat);
    const wantSub = safeStr(subcat);
    const wantProv = safeStr(prov);

    let out = anuncios.filter((a) => {
      const aCat = safeStr(a.categoria);
      const aSub = safeStr(a.subcategoria);
      const aProv = safeStr(a.provincia);

      if (wantCat && aCat !== wantCat) return false;
      if (wantSub && aSub !== wantSub) return false;
      if (wantProv && aProv !== wantProv) return false;

      if (soloConFotos) {
        if (!Array.isArray(a.fotos) || a.fotos.length === 0) return false;
      }

      if (!qq) return true;

      const zona = normalizeLower(a.canton || a.ciudad || "");
      const hay =
        normalizeLower(a.titulo).includes(qq) ||
        normalizeLower(a.descripcion).includes(qq) ||
        normalizeLower(aSub).includes(qq) ||
        normalizeLower(aCat).includes(qq) ||
        normalizeLower(aProv).includes(qq) ||
        zona.includes(qq);

      return hay;
    });

    // orden
    if (sort === "recientes") {
      out = out.slice().sort((a, b) => {
        const da = String(a.createdAt ?? "");
        const db = String(b.createdAt ?? "");
        return db.localeCompare(da);
      });
    } else if (sort === "precio_asc") {
      out = out.slice().sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
    } else if (sort === "precio_desc") {
      out = out.slice().sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
    }

    return out;
  }, [anuncios, q, cat, subcat, prov, soloConFotos, sort]);

  function limpiarFiltros() {
    setQ("");
    setCat("");
    setSubcat("");
    setProv("");
    setSoloConFotos(false);
    setSort("recientes");
  }

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ background: "white", borderBottom: `1px solid ${COLORS.border}` }}>
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
        {/* Normas + link */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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

        {/* Caja de filtros “grande” */}
        <div style={{ marginTop: 14, ...card(), padding: 14 }}>
          {/* chips categorías rápidas */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: COLORS.subtext, fontWeight: 950, fontSize: 12, marginRight: 4 }}>Categorías:</span>
            <span
              style={chip(cat === "")}
              onClick={() => setCat("")}
              role="button"
              aria-label="Todas"
              title="Todas"
            >
              Todas
            </span>
            {chipsCategorias.map((c) => (
              <span
                key={c}
                style={chip(cat === c)}
                onClick={() => setCat((prev) => (prev === c ? "" : c))}
                role="button"
                aria-label={c}
                title={c}
              >
                {c}
              </span>
            ))}
          </div>

          {/* grid filtros */}
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1.2fr 0.9fr 0.9fr",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: COLORS.subtext, marginBottom: 6 }}>Buscar</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Título, descripción, zona, subcategoría…"
                style={inputStyle()}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: COLORS.subtext, marginBottom: 6 }}>Provincia</div>
              <select value={prov} onChange={(e) => setProv(e.target.value)} style={selectStyle()}>
                <option value="">Todas</option>
                {provincias.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: COLORS.subtext, marginBottom: 6 }}>Ordenar</div>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} style={selectStyle()}>
                <option value="recientes">Más recientes</option>
                <option value="precio_asc">Precio: menor → mayor</option>
                <option value="precio_desc">Precio: mayor → menor</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: COLORS.subtext, marginBottom: 6 }}>Categoría</div>
              <select value={cat} onChange={(e) => setCat(e.target.value)} style={selectStyle()}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: COLORS.subtext, marginBottom: 6 }}>Subcategoría</div>
              <select value={subcat} onChange={(e) => setSubcat(e.target.value)} style={selectStyle()}>
                <option value="">Todas</option>
                {subcategorias.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <label
                style={{
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                  fontWeight: 950,
                  color: COLORS.text,
                  userSelect: "none",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={soloConFotos}
                  onChange={(e) => setSoloConFotos(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Solo con fotos
              </label>

              <button onClick={limpiarFiltros} type="button" style={btnSoft()}>
                Limpiar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, color: COLORS.subtext, fontWeight: 850, fontSize: 13 }}>
            {loading ? "Cargando…" : `${filtrados.length} anuncio(s)`}
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
              <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800 }}>
                Prueba a quitar la categoría/subcategoría o a borrar el texto.
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={limpiarFiltros} style={btnGhost()} type="button">
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {filtrados.map((a) => {
                const img = Array.isArray(a.fotos) && a.fotos.length > 0 ? a.fotos[0] : null;
                const lugar = `${a.canton || a.ciudad || "—"}, ${a.provincia || "—"}`;
                const catLabel = a.categoria || "—";
                const subLabel = a.subcategoria ? ` · ${a.subcategoria}` : "";
                const fecha = a.createdAt ? new Date(a.createdAt).toLocaleDateString("es-CR") : "";

                return (
                  <Link
                    key={a.id}
                    href={`/anuncio/${a.id}`}
                    style={{ ...card(), display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        height: 170,
                        background: img ? `url(${img}) center/cover no-repeat` : COLORS.soft,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    />
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 18, fontWeight: 950, color: COLORS.text, lineHeight: 1.15 }}>
                        {a.titulo || "Sin título"}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "baseline",
                        }}
                      >
                        <div style={{ fontWeight: 950, color: COLORS.text }}>{formatCRC(Number(a.precio || 0))}</div>

                        <div style={{ color: COLORS.subtext, fontWeight: 900, fontSize: 12, textAlign: "right" }}>
                          {catLabel}
                          {subLabel}
                        </div>
                      </div>

                      <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 850 }}>{lugar}</div>

                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: COLORS.muted, fontWeight: 900, fontSize: 12 }}>
                          {fecha ? `Publicado: ${fecha}` : ""}
                        </div>
                        <div style={{ color: COLORS.muted, fontWeight: 900, fontSize: 12 }}>{Array.isArray(a.fotos) && a.fotos.length ? "📷" : ""}</div>
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
