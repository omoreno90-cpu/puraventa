import Link from "next/link";

const COLORS = {
  navy: "#0A2540",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  danger: "#DC2626",
  ok: "#16A34A",
};

function cardStyle(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
  };
}

function liStyle(): React.CSSProperties {
  return { marginTop: 10, lineHeight: 1.65 };
}

export default function NormasPage() {
  return (
    <main
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
        background: COLORS.bg,
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px 60px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: COLORS.navy,
            fontWeight: 800,
          }}
        >
          ← Volver
        </Link>

        <header style={{ marginTop: 16 }}>
          <h1 style={{ margin: 0, fontSize: 36, letterSpacing: -0.5, color: COLORS.text, fontWeight: 900 }}>
            Normas de PuraVenta
          </h1>
          <p style={{ marginTop: 10, marginBottom: 0, color: COLORS.subtext, fontSize: 16, lineHeight: 1.7 }}>
            PuraVenta <b>no gestiona pagos</b>. Solo conecta personas. Publicar implica aceptar estas normas.
          </p>
        </header>

        <section style={{ marginTop: 18, ...cardStyle() }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text, fontWeight: 900 }}>
            🚫 Prohibido
          </h2>
          <p style={{ marginTop: 8, color: COLORS.subtext, lineHeight: 1.7 }}>
            Si un anuncio incumple, puede ser eliminado. Usa <b>Reportar</b> cuando veas algo sospechoso.
          </p>

          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li style={liStyle()}>
              <b>Animales:</b> no se permite venta, regalo, adopción ni cría.
            </li>
            <li style={liStyle()}>
              <b>Contenido sexual:</b> servicios sexuales, contenido explícito o sugerente.
            </li>
            <li style={liStyle()}>
              <b>Menores:</b> cualquier contenido sexual o explotación de menores (cero tolerancia).
            </li>
            <li style={liStyle()}>
              <b>Estafas:</b> depósitos por adelantado, “reservas”, enlaces raros, “solo sinpe ya”.
            </li>
            <li style={liStyle()}>
              <b>Productos ilegales:</b> drogas, armas, falsificaciones, etc.
            </li>
            <li style={liStyle()}>
              <b>Spam:</b> anuncios duplicados o repetidos.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 14, ...cardStyle() }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text, fontWeight: 900 }}>
            🏠 Alquiler de casas y apartamentos
          </h2>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.ok, fontWeight: 900 }}>✅</span>
              <div style={{ lineHeight: 1.65, color: COLORS.text }}>
                Solo alquiler directo entre particulares.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.danger, fontWeight: 900 }}>❌</span>
              <div style={{ lineHeight: 1.65, color: COLORS.text }}>
                No inmobiliarias/corredores.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.danger, fontWeight: 900 }}>❌</span>
              <div style={{ lineHeight: 1.65, color: COLORS.text }}>
                No anuncios duplicados.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 14, ...cardStyle() }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text, fontWeight: 900 }}>
            🛡️ Consejos anti-estafa
          </h2>

          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li style={liStyle()}>Nunca envíes dinero por adelantado.</li>
            <li style={liStyle()}>Reúnete en lugares públicos si es posible.</li>
            <li style={liStyle()}>
              Si algo suena demasiado bueno para ser verdad, probablemente lo es.
            </li>
          </ul>

          <div
            style={{
              marginTop: 14,
              border: `1px solid ${COLORS.border}`,
              background: "#FBFCFF",
              borderRadius: 14,
              padding: 12,
              color: COLORS.subtext,
              lineHeight: 1.7,
            }}
          >
            Si ves algo raro, usa <b style={{ color: COLORS.text }}>Reportar</b> en el anuncio.
          </div>
        </section>

        <footer style={{ marginTop: 18, color: COLORS.muted, fontSize: 12, lineHeight: 1.7 }}>
          Nota: en esta versión (MVP) los reportes se guardan localmente en tu navegador. En producción,
          los enviaremos al panel de admin.
        </footer>
      </div>
    </main>
  );
}
