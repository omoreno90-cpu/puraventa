"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
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

const SUBCATEGORIAS: Record<Categoria, string[]> = {
  Muebles: ["Sala", "Dormitorio", "Cocina", "Baño", "Oficina", "Exterior", "Otros"],
  Electrodomésticos: ["Cocina", "Limpieza", "Clima", "Pequeños", "Otros"],
  Tecnología: ["Celulares", "Ordenadores", "Tablets", "Consolas", "Audio", "TV", "Accesorios", "Otros"],
  "Motos y vehículos": ["Motos", "Carros", "Repuestos", "Accesorios", "Otros"],
  "Deportes & outdoor": ["Gimnasio", "Ciclismo", "Camping", "Surf", "Fútbol", "Otros"],
  Hogar: ["Decoración", "Iluminación", "Ferretería", "Jardín", "Mascotas", "Otros"],
  "Alquiler de casas y apartamentos": ["Casa", "Apartamento", "Habitación", "Oficina", "Otros"],
  Otros: ["Otros"],
};

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

function card(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(10, 20, 40, 0.06)",
  };
}

function btnPrimary(disabled?: boolean): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: `1px solid ${COLORS.navy}`,
    background: disabled ? COLORS.border : COLORS.navy,
    color: disabled ? "#7A8193" : "white",
    fontWeight: 950,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
    color: COLORS.text,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error subiendo foto");
  if (!data?.url) throw new Error("Upload sin URL");
  return String(data.url);
}

function onlyDigits(x: string) {
  return String(x || "").replace(/\D/g, "");
}

export default function PublicarPage() {
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [provincia, setProvincia] = useState<(typeof PROVINCIAS)[number]>("San José");
  const [ciudad, setCiudad] = useState<string>(CANTONES["San José"]?.[0] || "");
  const [categoria, setCategoria] = useState<Categoria>("Muebles");
  const [subcategoria, setSubcategoria] = useState<string>(SUBCATEGORIAS["Muebles"][0] || "Otros");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [vehiculoAno, setVehiculoAno] = useState<string>("");
  const [marchamoAlDia, setMarchamoAlDia] = useState<string>("");
  const [dekraAlDia, setDekraAlDia] = useState<string>("");
  const [dekraMes, setDekraMes] = useState<string>("");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cantonesDisponibles = useMemo(() => CANTONES[provincia] ?? [], [provincia]);
  const esVehiculo = categoria === "Motos y vehículos";

  function limpiarPreviews(next: string[]) {
    previews.forEach((u) => {
      try { URL.revokeObjectURL(u); } catch {}
    });
    setPreviews(next);
  }

  function onPickFotos(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const incoming = e.target.files ? Array.from(e.target.files) : [];
    if (!incoming.length) return;

    const cupo = Math.max(0, 5 - files.length);
    const slice = incoming.slice(0, cupo);

    for (const f of slice) {
      if (f.size > 2_000_000) {
        setError("Cada foto debe pesar menos de 2 MB.");
        return;
      }
    }

    const next = [...files, ...slice];
    setFiles(next);
    limpiarPreviews([...previews, ...slice.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function quitarFoto(idx: number) {
    const nextFiles = files.filter((_, i) => i !== idx);
    const nextPrev = previews.filter((_, i) => i !== idx);
    setFiles(nextFiles);
    limpiarPreviews(nextPrev);
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError(null);

    try {
      if (titulo.trim().length < 5) throw new Error("Pon un título más descriptivo (mín. 5 caracteres).");
      if (descripcion.trim().length < 10) throw new Error("Añade una descripción (mín. 10 caracteres).");

      const precioNum = Number(precio);
      if (!Number.isFinite(precioNum) || precioNum <= 0) throw new Error("Pon un precio válido.");

      const ws = onlyDigits(whatsapp);
      if (ws.length < 8) throw new Error("WhatsApp es obligatorio (mínimo 8 dígitos).");

      const mod = moderarTexto({ titulo, descripcion, categoria });
      if (!mod.ok) throw new Error(mod.mensaje || "El anuncio no cumple normas.");

      let fotos: string[] = [];
      if (files.length) {
        for (const f of files) fotos.push(await uploadToCloudinary(f));
      }

      const payloadVehiculo: any = {};
      if (esVehiculo) {
        payloadVehiculo.vehiculoAno = vehiculoAno ? Number(vehiculoAno) : undefined;
        payloadVehiculo.marchamoAlDia = marchamoAlDia === "si" ? true : marchamoAlDia === "no" ? false : undefined;
        payloadVehiculo.dekraAlDia = dekraAlDia === "si" ? true : dekraAlDia === "no" ? false : undefined;
        payloadVehiculo.dekraMes = dekraMes?.trim() ? dekraMes.trim() : undefined;
      }

      const payload: any = {
        titulo: titulo.trim(),
        precio: precioNum,
        provincia,
        ciudad,
        categoria,
        subcategoria,
        descripcion: descripcion.trim(),
        whatsapp: ws,
        fotos: fotos.slice(0, 5),
        ...payloadVehiculo,
      };

      const res = await fetch("/api/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error publicando anuncio");

      const id = String(data?.anuncio?.id || "");
      setTitulo("");
      setPrecio("");
      setDescripcion("");
      setFiles([]);
      limpiarPreviews([]);
      setVehiculoAno("");
      setMarchamoAlDia("");
      setDekraAlDia("");
      setDekraMes("");

      if (id) window.location.href = `/anuncio/${encodeURIComponent(id)}`;
    } catch (err: any) {
      setError(err?.message || "Error al publicar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950, color: COLORS.text }}>Publicar anuncio</h1>
          <Link href="/" style={btnGhost()}>← Volver</Link>
        </div>

        <div style={{ ...card(), marginTop: 14 }}>
          <form onSubmit={publicar} style={{ display: "grid", gap: 12 }}>
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
                  const list = CANTONES[p] ?? [];
                  if (list.length) setCiudad(list[0]);
                }}
              >
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select style={selectStyle()} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                {(cantonesDisponibles.length ? cantonesDisponibles : ["—"]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select style={selectStyle()} value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select style={selectStyle()} value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)}>
                {(SUBCATEGORIAS[categoria] ?? ["Otros"]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <textarea
              style={{ ...inputStyle(), minHeight: 120, resize: "vertical" }}
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

            {esVehiculo && (
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 14, background: "#FBFCFF" }}>
                <div style={{ fontWeight: 950, color: COLORS.text }}>Datos del vehículo</div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    style={inputStyle()}
                    placeholder="Año (ej: 2019)"
                    value={vehiculoAno}
                    onChange={(e) => setVehiculoAno(e.target.value)}
                    inputMode="numeric"
                  />

                  <input
                    style={inputStyle()}
                    placeholder="Mes DEKRA (ej: Junio)"
                    value={dekraMes}
                    onChange={(e) => setDekraMes(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <select style={selectStyle()} value={marchamoAlDia} onChange={(e) => setMarchamoAlDia(e.target.value)}>
                    <option value="">Marchamo al día (opcional)</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>

                  <select style={selectStyle()} value={dekraAlDia} onChange={(e) => setDekraAlDia(e.target.value)}>
                    <option value="">DEKRA al día (opcional)</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 16, padding: 14, background: "#FBFCFF" }}>
              <div style={{ fontWeight: 950, color: COLORS.text }}>Fotos (máx. 5)</div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 800, fontSize: 13 }}>2MB máximo por foto.</div>

              <div style={{ marginTop: 10 }}>
                <input type="file" accept="image/*" multiple onChange={onPickFotos} disabled={files.length >= 5} />
              </div>

              {previews.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                  {previews.map((src, i) => (
                    <div
                      key={src}
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
                          fontWeight: 900,
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

            {error && <div style={{ color: COLORS.danger, fontWeight: 950 }}>{error}</div>}

            <button type="submit" disabled={guardando} style={btnPrimary(guardando)}>
              {guardando ? "Publicando..." : "Publicar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}