"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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

type ApiAnuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string;
  whatsapp: string;
  fotos: string[];
  categoria: string;
  subcategoria: string;
  createdAt: string;
  updatedAt?: string;

  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
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

function ghostBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    fontWeight: 750,
    cursor: disabled ? "not-allowed" : "pointer",
    color: COLORS.text,
    opacity: disabled ? 0.6 : 1,
  };
}

function normalizeWs(x: any) {
  return String(x ?? "").replace(/\D/g, "");
}

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error subiendo foto");
  if (!data?.url) throw new Error("Upload sin URL");
  return String(data.url);
}

export default function EditarPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [provincia, setProvincia] = useState<(typeof PROVINCIAS)[number]>("San José");
  const [ciudad, setCiudad] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Muebles");
  const [subcategoria, setSubcategoria] = useState<string>(SUBCATEGORIAS["Muebles"][0] || "Otros");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); // mostrado en UI

  // ✅ fotos existentes (URLs guardadas)
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);

  // ✅ fotos nuevas (Files) + previews
  const [filesNuevos, setFilesNuevos] = useState<File[]>([]);
  const [previewsNuevos, setPreviewsNuevos] = useState<string[]>([]);

  // ✅ Vehículo (opcionales)
  const [vehiculoAno, setVehiculoAno] = useState<string>("");
  const [marchamoAlDia, setMarchamoAlDia] = useState<string>(""); // "", "si", "no"
  const [dekraAlDia, setDekraAlDia] = useState<string>(""); // "", "si", "no"
  const [dekraMes, setDekraMes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cantonesDisponibles = useMemo(() => CANTONES[provincia] ?? [], [provincia]);

  function limpiarPreviews(next: string[]) {
    previewsNuevos.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    setPreviewsNuevos(next);
  }

  useEffect(() => {
    return () => {
      previewsNuevos.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar() {
    if (!id) return;
    setCargando(true);
    setErrorCarga(null);
    setError(null);

    try {
      const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) throw new Error(json?.error || "Anuncio no encontrado");

      const a = json.anuncio as ApiAnuncio;

      setTitulo(String(a?.titulo ?? ""));
      setPrecio(String(a?.precio ?? ""));
      setProvincia((a?.provincia as any) || "San José");

      const ciudadValor = String(a?.ciudad ?? "");
      setCiudad(ciudadValor);

      const cat = ((a?.categoria as any) || "Muebles") as Categoria;
      setCategoria(cat);

      const fallbackSub = SUBCATEGORIAS[cat]?.[0] ? SUBCATEGORIAS[cat][0] : "Otros";
      setSubcategoria(String(a?.subcategoria ? a.subcategoria : fallbackSub));

      setDescripcion(String(a?.descripcion ?? ""));
      setWhatsapp(String(a?.whatsapp ?? ""));

      setFotosExistentes(Array.isArray(a?.fotos) ? a.fotos : []);
      setFilesNuevos([]);
      limpiarPreviews([]);

      setVehiculoAno(a?.vehiculoAno ? String(a.vehiculoAno) : "");
      setMarchamoAlDia(a?.marchamoAlDia === true ? "si" : a?.marchamoAlDia === false ? "no" : "");
      setDekraAlDia(a?.dekraAlDia === true ? "si" : a?.dekraAlDia === false ? "no" : "");
      setDekraMes(String(a?.dekraMes ?? ""));
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

  useEffect(() => {
    const list = SUBCATEGORIAS[categoria] ?? ["Otros"];
    if (!list.includes(subcategoria)) setSubcategoria(list[0] || "Otros");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  useEffect(() => {
    const list = CANTONES[provincia] ?? [];
    if (list.length && !list.includes(ciudad)) setCiudad(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provincia]);

  const totalFotos = fotosExistentes.length + filesNuevos.length;
  const puedeAgregarMas = totalFotos < 5;

  async function onPickFotos(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const incoming = e.target.files ? Array.from(e.target.files) : [];
    if (incoming.length === 0) return;

    const cupo = Math.max(0, 5 - (fotosExistentes.length + filesNuevos.length));
    const slice = incoming.slice(0, cupo);

    for (const f of slice) {
      if (f.size > 2_000_000) {
        setError("Cada foto debe pesar menos de 2 MB.");
        return;
      }
    }

    const nextFiles = [...filesNuevos, ...slice];
    setFilesNuevos(nextFiles);

    const nextPreviews = [...previewsNuevos, ...slice.map((f) => URL.createObjectURL(f))];
    limpiarPreviews(nextPreviews);

    e.target.value = "";
  }

  function quitarExistente(idx: number) {
    setFotosExistentes((prev) => prev.filter((_, i) => i !== idx));
  }

  function quitarNuevo(idx: number) {
    const nextFiles = filesNuevos.filter((_, i) => i !== idx);
    const nextPreviews = previewsNuevos.filter((_, i) => i !== idx);
    setFilesNuevos(nextFiles);
    limpiarPreviews(nextPreviews);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setError(null);
    setGuardando(true);

    try {
      if (titulo.trim().length < 5) throw new Error("Pon un título más descriptivo (mín. 5 caracteres).");
      if (descripcion.trim().length < 10) throw new Error("Añade una descripción (mín. 10 caracteres).");

      const precioNum = Number(precio);
      if (!Number.isFinite(precioNum) || precioNum <= 0) throw new Error("Pon un precio válido.");

      // 🔒 Confirmación propietaria por WhatsApp
      const wsConfirm = prompt("Introduce tu WhatsApp para confirmar (solo números):") || "";
      const wsClean = normalizeWs(wsConfirm);
      if (!wsClean) throw new Error("Debes introducir tu WhatsApp.");

      const mod = moderarTexto({ titulo, descripcion, categoria });
      if (!mod.ok) throw new Error(mod.mensaje || "El anuncio no cumple normas.");

      let nuevasUrls: string[] = [];
      if (filesNuevos.length > 0) {
        nuevasUrls = [];
        for (const f of filesNuevos) {
          const url = await uploadToCloudinary(f);
          nuevasUrls.push(url);
        }
      }

      const fotosFinales = [...fotosExistentes, ...nuevasUrls].slice(0, 5);

      const vehAnoNum =
        vehiculoAno.trim() === "" ? undefined : Number(vehiculoAno.trim());
      const vehiculoAnoFinal =
        vehiculoAno.trim() === "" ? undefined : (Number.isFinite(vehAnoNum) ? vehAnoNum : undefined);

      const marchamoFinal =
        marchamoAlDia === "si" ? true : marchamoAlDia === "no" ? false : undefined;

      const dekraFinal =
        dekraAlDia === "si" ? true : dekraAlDia === "no" ? false : undefined;

      const dekraMesFinal = dekraMes.trim() ? dekraMes.trim() : undefined;

      const payload = {
        titulo: titulo.trim(),
        precio: precioNum,
        provincia,
        ciudad,
        categoria,
        subcategoria,
        descripcion: descripcion.trim(),

        // 🔒 este whatsapp se usa para validar en el API (debe coincidir con el del anuncio)
        whatsapp: wsClean,

        fotos: fotosFinales,

        // 🚗 opcionales
        vehiculoAno: vehiculoAnoFinal,
        marchamoAlDia: marchamoFinal,
        dekraAlDia: dekraFinal,
        dekraMes: dekraMesFinal,
      };

      const res = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error guardando anuncio");

      router.push(`/anuncio/${encodeURIComponent(id)}`);
    } catch (err: any) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 18 }}>
            <b>Cargando…</b>
          </div>
        </div>
      </main>
    );
  }

  if (errorCarga) {
    return (
      <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 18 }}>
            <div style={{ fontWeight: 900, color: COLORS.danger }}>Anuncio no encontrado.</div>
            <div style={{ marginTop: 8, color: COLORS.subtext, fontWeight: 700 }}>{errorCarga}</div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={cargar} style={primaryBtn()}>
                Reintentar
              </button>
              <Link href="/" style={{ ...ghostBtn(), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Volver
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const esVehiculo = categoria === "Motos y vehículos";

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
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: COLORS.text }}>Editar anuncio</h1>
            <button type="button" onClick={() => router.push(`/anuncio/${encodeURIComponent(id)}`)} style={ghostBtn()}>
              Volver
            </button>
          </div>

          <p style={{ marginTop: 8, color: COLORS.subtext, lineHeight: 1.5, fontWeight: 600 }}>
            Edita y guarda cambios. Puedes <b>quitar</b> fotos existentes y <b>añadir</b> fotos nuevas.
          </p>

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
                }}
              >
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select style={selectStyle()} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                {(cantonesDisponibles.length ? cantonesDisponibles : ["—"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select style={selectStyle()} value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select style={selectStyle()} value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)}>
                {(SUBCATEGORIAS[categoria] ?? ["Otros"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {esVehiculo && (
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, background: "#FBFCFF" }}>
                <div style={{ fontWeight: 950, color: COLORS.text }}>Datos del vehículo</div>
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <input
                    style={inputStyle()}
                    placeholder="Año del vehículo (ej: 2015)"
                    value={vehiculoAno}
                    onChange={(e) => setVehiculoAno(e.target.value)}
                    inputMode="numeric"
                  />

                  <select style={selectStyle()} value={marchamoAlDia} onChange={(e) => setMarchamoAlDia(e.target.value)}>
                    <option value="">Marchamo al día: —</option>
                    <option value="si">Marchamo al día: Sí</option>
                    <option value="no">Marchamo al día: No</option>
                  </select>

                  <select style={selectStyle()} value={dekraAlDia} onChange={(e) => setDekraAlDia(e.target.value)}>
                    <option value="">DEKRA al día: —</option>
                    <option value="si">DEKRA al día: Sí</option>
                    <option value="no">DEKRA al día: No</option>
                  </select>

                  <input
                    style={inputStyle()}
                    placeholder="Mes DEKRA (ej: marzo)"
                    value={dekraMes}
                    onChange={(e) => setDekraMes(e.target.value)}
                  />
                </div>
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
              placeholder="WhatsApp (este es el del anuncio)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
              disabled
              title="El WhatsApp del anuncio no se edita aquí. Se usa para validar propiedad."
            />

            {/* ✅ FOTOS */}
            <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 16, padding: 14, background: "#FBFCFF" }}>
              <div style={{ fontWeight: 900, color: COLORS.text }}>
                Fotos (máx. 5) — actuales: <b>{totalFotos}</b>/5
              </div>
              <div style={{ marginTop: 6, color: COLORS.subtext, fontSize: 13, fontWeight: 600 }}>
                Puedes quitar las actuales y/o añadir nuevas (2MB máx por foto).
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input type="file" accept="image/*" multiple onChange={onPickFotos} disabled={!puedeAgregarMas} />
                {!puedeAgregarMas && (
                  <span style={{ color: COLORS.danger, fontWeight: 800, fontSize: 12 }}>
                    Ya tienes 5 fotos. Quita alguna para añadir.
                  </span>
                )}
              </div>

              {(fotosExistentes.length > 0 || previewsNuevos.length > 0) && (
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 10,
                  }}
                >
                  {fotosExistentes.map((src, i) => (
                    <div
                      key={`old-${i}`}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: COLORS.card,
                        position: "relative",
                      }}
                      title="Foto existente"
                    >
                      <div style={{ height: 110, background: `url(${src}) center/cover no-repeat` }} />
                      <button
                        type="button"
                        onClick={() => quitarExistente(i)}
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

                  {previewsNuevos.map((src, i) => (
                    <div
                      key={`new-${i}`}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: COLORS.card,
                        position: "relative",
                      }}
                      title="Foto nueva (aún no subida)"
                    >
                      <div style={{ height: 110, background: `url(${src}) center/cover no-repeat` }} />
                      <button
                        type="button"
                        onClick={() => quitarNuevo(i)}
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

            {error && <div style={{ color: COLORS.danger, fontWeight: 900 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={guardando} style={primaryBtn(guardando)}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>

              <button type="button" onClick={cargar} disabled={guardando} style={ghostBtn(guardando)}>
                Recargar
              </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: COLORS.subtext, fontWeight: 600 }}>
              Al guardar, las fotos nuevas se suben y luego se actualiza el anuncio. Te pediremos tu WhatsApp para confirmar.
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
