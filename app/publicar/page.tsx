"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { obtenerOwnerToken } from "@/lib/storage";
import { PROVINCIAS, CANTONES } from "@/lib/ubicaciones";
import { moderarTexto } from "@/lib/moderacion";

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

function ghostBtn(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 650,
    cursor: "pointer",
    color: COLORS.text,
  };
}

function chipStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    color: COLORS.text,
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}

export default function PublicarPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [provincia, setProvincia] = useState<(typeof PROVINCIAS)[number]>("San José");
  const [canton, setCanton] = useState(CANTONES["San José"][0]);
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Muebles");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  const cantonesDisponibles = useMemo(() => CANTONES[provincia], [provincia]);

  async function onPickFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setError(null);

    const list = Array.from(files).slice(0, 5);

    // valida peso antes de convertir a base64 (máx 2MB por foto)
    for (const f of list) {
      if (f.size > 2_000_000) {
        setError("Cada foto debe pesar menos de 2 MB.");
        return;
      }
    }

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

  function quitarFoto(idx: number) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (publicando) return;

    setError(null);
    setPublicando(true);

    try {
      if (titulo.trim().length < 5) {
        setError("Pon un título más descriptivo (mín. 5 caracteres).");
        return;
      }
      if (descripcion.trim().length < 10) {
        setError("Añade una descripción (mín. 10 caracteres).");
        return;
      }

      // WhatsApp obligatorio: solo números
      const ws = whatsapp.replace(/\D/g, "");
      if (ws.length < 8) {
        setError("WhatsApp es obligatorio (mínimo 8 dígitos).");
        return;
      }

      const precioNum = Number(precio);
      if (!Number.isFinite(precioNum) || precioNum <= 0) {
        setError("Pon un precio válido.");
        return;
      }

      // ✅ Moderación de texto (bloquea antes de guardar)
      const mod = moderarTexto({ titulo, descripcion, categoria });
      if (!mod.ok) {
        setError(mod.mensaje || "El anuncio no cumple normas.");
        return;
      }

      const ownerToken = obtenerOwnerToken();

      const anuncio = {
        id: crypto.randomUUID(),
        titulo: titulo.trim(),
        precio: precioNum,
        provincia,
        canton,
        categoria,
        descripcion: descripcion.trim(),
        whatsapp: ws,
        fotos,
        creadoEn: new Date().toISOString(),
        ownerToken,
      };

      // ✅ PUBLICAR EN SERVIDOR (API)
      const res = await fetch("/api/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anuncio),
      });

      if (!res.ok) {
        throw new Error("No se pudo publicar en el servidor.");
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Error al publicar.");
    } finally {
      setPublicando(false);
    }
  }

  const esAlquiler = categoria === "Alquiler de casas y apartamentos";

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
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: COLORS.text }}>Publicar anuncio</h1>
            <button type="button" onClick={() => router.push("/")} style={ghostBtn()}>
              Cancelar
            </button>
          </div>

          <p style={{ marginTop: 8, color: COLORS.subtext, lineHeight: 1.5 }}>
            Publicar es gratis. <b>PuraVenta no gestiona pagos. Solo te conectamos.</b>
            <br />
            Consejo anti-estafa: <b>nunca envíes dinero por adelantado.</b>
          </p>

          <div
            style={{
              marginTop: 14,
              border: `1px solid ${COLORS.border}`,
              background: "#FBFCFF",
              borderRadius: 16,
              padding: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={chipStyle()}>❌ No animales</span>
              <span style={chipStyle()}>❌ No sexo</span>
              <span style={chipStyle()}>❌ No estafas</span>
              <span style={chipStyle()}>❌ Ilegal/armas/drogas</span>
            </div>
            <Link href="/normas" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
              Ver normas →
            </Link>
          </div>

          <form onSubmit={publicar} style={{ marginTop: 18, display: "grid", gap: 12 }}>
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

            <select style={selectStyle()} value={categoria} onChange={(e) => setCategoria(e.target.value as any)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {esAlquiler && (
              <div
                style={{
                  border: `1px solid ${COLORS.border}`,
                  background: "#FBFCFF",
                  borderRadius: 14,
                  padding: 12,
                  color: COLORS.text,
                  fontWeight: 650,
                }}
              >
                🏠 <b>Alquiler:</b> solo anuncios directos entre particulares. <b>No inmobiliarias</b> ni anuncios duplicados.
              </div>
            )}

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

            <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 16, padding: 14, background: "#FBFCFF" }}>
              <div style={{ fontWeight: 800, color: COLORS.text }}>Fotos (máx. 5)</div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontSize: 13 }}>Evita fotos con contenido sexual o sensible.</div>

              <input style={{ marginTop: 10 }} type="file" accept="image/*" multiple onChange={onPickFotos} />

              {fotos.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 10,
                  }}
                >
                  {fotos.map((src, i) => (
                    <div
                      key={i}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: COLORS.card,
                        position: "relative",
                      }}
                    >
                      <div style={{ height: 110, background: `url(${src}) center/cover no-repeat` }} />
                      <button
                        type="button"
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

            {error && <div style={{ color: COLORS.danger, fontWeight: 750 }}>{error}</div>}

            <button type="submit" disabled={publicando} style={primaryBtn(publicando)}>
              {publicando ? "Publicando..." : "Publicar anuncio"}
            </button>

            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.subtext }}>
              Al publicar aceptas las{" "}
              <Link href="/normas" style={{ color: COLORS.navy, fontWeight: 800 }}>
                normas
              </Link>
              .
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
