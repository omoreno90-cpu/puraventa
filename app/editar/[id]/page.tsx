// app/editar/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Inter } from "next/font/google";
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
  success: "#16A34A",
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

type Categoria = (typeof CATEGORIAS)[number];

const SUBCATEGORIAS: Record<string, string[]> = {
  "Muebles": ["Sofás", "Mesas", "Sillas", "Camas", "Armarios", "Oficina", "Otros"],
  "Electrodomésticos": ["Cocina", "Limpieza", "Clima", "Pequeño electrodoméstico", "Otros"],
  "Tecnología": ["Celulares", "Ordenadores", "Tablets", "Consolas", "TV/Audio", "Accesorios", "Otros"],
  "Motos y vehículos": ["Motos", "Carros", "Repuestos", "Accesorios", "Servicios", "Otros"],
  "Deportes & outdoor": ["Gym", "Bicis", "Camping", "Surf/Mar", "Fútbol", "Otros"],
  "Hogar": ["Cocina", "Baño", "Decoración", "Jardín", "Iluminación", "Otros"],
  "Alquiler de casas y apartamentos": ["Apartamento", "Casa", "Habitación", "Otros"],
  "Otros": ["Otros"],
};

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    outline: "none",
    fontWeight: 600,
    color: COLORS.text,
  };
}

function selectStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 700,
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
    fontWeight: 850,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 750,
    cursor: "pointer",
    color: COLORS.text,
  };
}

type ApiGet = { ok: boolean; anuncio?: any; error?: string };

export default function EditarPage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const raw: any = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : String(raw || "");
  }, [params]);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [provincia, setProvincia] = useState<(typeof PROVINCIAS)[number]>("San José");
  const [canton, setCanton] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Muebles");
  const [subcategoria, setSubcategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const cantonesDisponibles = useMemo(() => CANTONES[provincia], [provincia]);
  const subcats = useMemo(() => SUBCATEGORIAS[categoria] ?? ["Otros"], [categoria]);

  useEffect(() => {
    if (!subcats.includes(subcategoria)) {
      setSubcategoria(subcats[0] || "Otros");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  useEffect(() => {
    if (!cantonesDisponibles.includes(canton)) {
      setCanton(cantonesDisponibles[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provincia]);

  async function cargar() {
    if (!id) return;
    setCargando(true);
    setErrorCarga(null);

    try {
      const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as ApiGet;

      if (!res.ok || !json?.ok || !json?.anuncio) {
        throw new Error(json?.error || "Anuncio no encontrado.");
      }

      const a = json.anuncio;

      setTitulo(String(a?.titulo ?? ""));
      setPrecio(String(a?.precio ?? ""));
      setProvincia((a?.provincia as any) || "San José");

      // API: ciudad / UI vieja: canton
      const city = String(a?.ciudad ?? a?.canton ?? "");
      setCanton(city);

      setCategoria((a?.categoria as any) || "Muebles");
      setSubcategoria(String(a?.subcategoria ?? SUBCATEGORIAS[(a?.categoria as any) || "Muebles"]?.[0] || "Otros"));
      setDescripcion(String(a?.descripcion ?? ""));
      setWhatsapp(String(a?.whatsapp ?? ""));
    } catch (e: any) {
      setErrorCarga(e?.message || "Error cargando anuncio.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;

    setError(null);
    setGuardando(true);

    try {
      const t = titulo.trim();
      const d = descripcion.trim();
      const ws = whatsapp.replace(/\D/g, "");

      const precioNum = Number(precio);
      if (t.length < 5) throw new Error("Pon un título más descriptivo (mín. 5 caracteres).");
      if (d.length < 10) throw new Error("Añade una descripción (mín. 10 caracteres).");
      if (!Number.isFinite(precioNum) || precioNum <= 0) throw new Error("Pon un precio válido.");
      if (ws.length < 8) throw new Error("WhatsApp es obligatorio (mínimo 8 dígitos).");

      const payload = {
        titulo: t,
        precio: precioNum,
        provincia,
        ciudad: canton, // API
        canton, // por compatibilidad si algo lo usa
        categoria,
        subcategoria,
        descripcion: d,
        whatsapp: ws,
      };

      const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Error guardando cambios.");
      }

      router.push(`/anuncio/${id}`);
    } catch (e: any) {
      setError(e?.message || "Error guardando.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 60px" }}>
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: COLORS.text }}>
              Editar anuncio
            </h1>
            <button type="button" onClick={() => router.push(`/anuncio/${id}`)} style={ghostBtn()}>
              Volver
            </button>
          </div>

          {cargando ? (
            <div style={{ marginTop: 18, color: COLORS.subtext, fontWeight: 700 }}>Cargando…</div>
          ) : errorCarga ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ color: COLORS.danger, fontWeight: 900 }}>{errorCarga}</div>
              <div style={{ marginTop: 10 }}>
                <button onClick={cargar} style={primaryBtn()}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={guardar} style={{ marginTop: 18, display: "grid", gap: 12 }}>
              <input style={inputStyle()} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

              <input
                style={inputStyle()}
                placeholder="Precio (₡)"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                inputMode="numeric"
              />

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
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <select style={selectStyle()} value={canton} onChange={(e) => setCanton(e.target.value)}>
                  {cantonesDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select
                  style={selectStyle()}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as Categoria)}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  style={selectStyle()}
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                >
                  {subcats.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                style={{ ...inputStyle(), minHeight: 110, resize: "vertical" }}
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              <input
                style={inputStyle()}
                placeholder="WhatsApp (obligatorio) — ej: 8888-8888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
              />

              {error && <div style={{ color: COLORS.danger, fontWeight: 900 }}>{error}</div>}

              <button type="submit" disabled={guardando} style={primaryBtn(guardando)}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>

              <div style={{ marginTop: 8, fontSize: 12, color: COLORS.subtext, fontWeight: 600 }}>
                Volver a{" "}
                <Link href={`/anuncio/${id}`} style={{ color: COLORS.navy, fontWeight: 900 }}>
                  ver el anuncio
                </Link>
                .
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
