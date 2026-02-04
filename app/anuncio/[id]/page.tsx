"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import {
  eliminarAnuncio,
  esPropietario,
  obtenerAnuncioPorId,
  obtenerOwnerToken,
  type Anuncio,
} from "@/lib/storage";
import { guardarReporte } from "@/lib/reportes";

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
  whatsapp: "#16A34A",
};

function formatFechaISO(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
}

function btn(style: React.CSSProperties): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 800,
    cursor: "pointer",
    ...style,
  };
}

const ADMIN_KEY = "puraventa_admin_ok";
const ADMIN_PIN_KEY = "puraventa_admin_pin";

function esAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "1";
}
function setAdminOk(ok: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_KEY, ok ? "1" : "0");
}
function getAdminPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_PIN_KEY);
}
function setAdminPin(pin: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export default function AnuncioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const anuncioId = params?.id ?? "";

  const anuncio = useMemo(() => (anuncioId ? obtenerAnuncioPorId(anuncioId) : null), [anuncioId]);

  const ownerToken = useMemo(() => obtenerOwnerToken(), []);
  const soyPropietario = anuncio ? esPropietario(anuncio, ownerToken) : false;

  // Reportar
  const [openReport, setOpenReport] = useState(false);
  const [motivo, setMotivo] = useState<"estafa" | "sexo" | "animales" | "ilegal" | "spam" | "otro">("estafa");
  const [detalle, setDetalle] = useState("");
  const [enviado, setEnviado] = useState(false);

  // Admin PIN modal
  const [openAdmin, setOpenAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);

  if (!anuncio) {
    return (
      <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
          <Link href="/" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            ← Volver
          </Link>
          <div
            style={{
              marginTop: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 900, color: COLORS.text }}>Anuncio no encontrado</div>
            <div style={{ marginTop: 6, color: COLORS.subtext }}>Puede haber caducado o haber sido eliminado.</div>
          </div>
        </div>
      </main>
    );
  }

  // ✅ A partir de aquí TypeScript ya lo trata como no-null
  const a: Anuncio = anuncio;

  const foto = a.fotos?.[0] || "";
  const whatsappLink =
    a.whatsapp?.trim()
      ? `https://wa.me/${a.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
          `Hola, vi tu anuncio en PuraVenta: "${a.titulo}". ¿Sigue disponible?`
        )}`
      : "";

  function pedirAdmin() {
    setPinErr(null);
    setOpenAdmin(true);
  }

  function confirmarAdmin() {
    setPinErr(null);
    const existing = getAdminPin();

    // Primera vez: define PIN
    if (!existing) {
      if (pin.trim().length < 4) {
        setPinErr("El PIN debe tener al menos 4 dígitos.");
        return;
      }
      setAdminPin(pin.trim());
      setAdminOk(true);
      setOpenAdmin(false);
      setPin("");
      return;
    }

    if (pin.trim() !== existing) {
      setPinErr("PIN incorrecto.");
      return;
    }

    setAdminOk(true);
    setOpenAdmin(false);
    setPin("");
  }

  function onEliminar() {
    const ok = confirm("¿Seguro que quieres eliminar este anuncio?");
    if (!ok) return;

    eliminarAnuncio(a.id);
    router.push("/");
  }

  function eliminarComoAdmin() {
    if (!esAdmin()) {
      pedirAdmin();
      return;
    }
    onEliminar();
  }

  function enviarReporte() {
    guardarReporte({
      anuncioId: a.id,
      motivo,
      detalle: detalle.trim() || undefined,
    });

    setEnviado(true);
    setTimeout(() => {
      setOpenReport(false);
      setEnviado(false);
      setDetalle("");
      setMotivo("estafa");
    }, 900);
  }

  return (
    <main className={inter.className} style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            ← Volver
          </Link>
          <Link href="/normas" style={{ color: COLORS.navy, fontWeight: 800, textDecoration: "none" }}>
            Normas
          </Link>
        </div>

        <section
          style={{
            marginTop: 14,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
          }}
        >
          <div
            style={{
              height: 340,
              background: foto ? `url(${foto}) center/cover no-repeat` : "linear-gradient(135deg, #EEF2FF, #F8FAFC)",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          />

          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: COLORS.text }}>{a.titulo}</h1>
                <div style={{ marginTop: 6, color: COLORS.subtext, fontWeight: 700 }}>
                  {a.canton}, {a.provincia} · Publicado: {formatFechaISO(a.creadoEn)}
                </div>
                <div style={{ marginTop: 6, color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>
                  Categoría: {a.categoria}
                </div>
              </div>

              <div style={{ fontSize: 22, fontWeight: 950, color: COLORS.navy }}>
                ₡{a.precio.toLocaleString("es-CR")}
              </div>
            </div>

            {a.descripcion ? (
              <p style={{ marginTop: 14, color: COLORS.text, lineHeight: 1.6 }}>{a.descripcion}</p>
            ) : (
              <p style={{ marginTop: 14, color: COLORS.muted }}>Sin descripción.</p>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => router.push("/")}
                style={btn({ border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text })}
              >
                Ver más anuncios
              </button>

              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...btn({ border: `1px solid ${COLORS.whatsapp}`, background: COLORS.whatsapp, color: "white" }),
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  WhatsApp
                </a>
              ) : (
                <button
                  style={btn({
                    border: `1px solid ${COLORS.border}`,
                    background: "#F1F5F9",
                    color: COLORS.muted,
                    cursor: "not-allowed",
                  })}
                  disabled
                >
                  WhatsApp no disponible
                </button>
              )}

              <button
                onClick={() => setOpenReport(true)}
                style={btn({ border: `1px solid ${COLORS.border}`, background: "#FFF5F5", color: COLORS.danger })}
              >
                Reportar
              </button>

              {soyPropietario && (
                <button
                  onClick={() => router.push(`/editar/${a.id}`)}
                  style={btn({ border: `1px solid ${COLORS.border}`, background: "#FBFCFF", color: COLORS.navy })}
                >
                  Editar
                </button>
              )}

              {(soyPropietario || esAdmin()) && (
                <button
                  onClick={onEliminar}
                  style={btn({ border: `1px solid ${COLORS.border}`, background: "#FFF5F5", color: COLORS.danger })}
                >
                  Eliminar
                </button>
              )}

              {!soyPropietario && !esAdmin() && (
                <button
                  onClick={eliminarComoAdmin}
                  style={btn({ border: `1px solid ${COLORS.border}`, background: "#F8FAFC", color: COLORS.text })}
                  title="Admin"
                >
                  Admin eliminar
                </button>
              )}
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: COLORS.subtext }}>
              PuraVenta no gestiona pagos. Consejo anti-estafa: nunca envíes dinero por adelantado.
            </div>
          </div>
        </section>

        {/* Modal reportar */}
        {openReport && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.45)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 50,
            }}
            onClick={() => setOpenReport(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                boxShadow: "0 18px 60px rgba(10,20,40,0.25)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 950, color: COLORS.text }}>Reportar anuncio</div>
                <button
                  onClick={() => setOpenReport(false)}
                  style={btn({ border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text })}
                >
                  Cerrar
                </button>
              </div>

              <div style={{ marginTop: 12, color: COLORS.subtext, fontSize: 13 }}>
                Selecciona un motivo. Si puedes, añade detalle (opcional).
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as any)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.card,
                    fontWeight: 700,
                    color: COLORS.text,
                  }}
                >
                  <option value="estafa">Estafa / fraude</option>
                  <option value="sexo">Contenido sexual</option>
                  <option value="animales">Animales (prohibido)</option>
                  <option value="ilegal">Producto ilegal (armas/drogas, etc.)</option>
                  <option value="spam">Spam / repetido</option>
                  <option value="otro">Otro</option>
                </select>

                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Detalle (opcional). Ej: pide depósito, contenido explícito, etc."
                  style={{
                    minHeight: 110,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.card,
                    outline: "none",
                    fontWeight: 500,
                    color: COLORS.text,
                    resize: "vertical",
                  }}
                />

                <button
                  onClick={enviarReporte}
                  style={btn({ border: `1px solid ${COLORS.navy}`, background: COLORS.navy, color: "white" })}
                >
                  {enviado ? "¡Gracias!" : "Enviar reporte"}
                </button>

                <div style={{ fontSize: 12, color: COLORS.subtext }}>
                  Los reportes ayudan a mantener PuraVenta seguro.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal admin PIN */}
        {openAdmin && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.45)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 60,
            }}
            onClick={() => setOpenAdmin(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                boxShadow: "0 18px 60px rgba(10,20,40,0.25)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 950, color: COLORS.text }}>Modo admin</div>
              <div style={{ marginTop: 8, color: COLORS.subtext, fontSize: 13 }}>
                {getAdminPin()
                  ? "Introduce tu PIN para habilitar admin en este navegador."
                  : "Primera vez: el PIN que pongas ahora quedará guardado en este navegador."}
              </div>

              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN (mínimo 4)"
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.card,
                  fontWeight: 700,
                }}
              />

              {pinErr && <div style={{ marginTop: 8, color: COLORS.danger, fontWeight: 800 }}>{pinErr}</div>}

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button onClick={confirmarAdmin} style={btn({ border: `1px solid ${COLORS.navy}`, background: COLORS.navy, color: "white" })}>
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setOpenAdmin(false);
                    setPin("");
                    setPinErr(null);
                  }}
                  style={btn({ border: `1px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.text })}
                >
                  Cancelar
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: COLORS.subtext }}>
                Para “salir” de admin: <code>localStorage.setItem("puraventa_admin_ok","0")</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
