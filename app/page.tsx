// app/page.tsx
export const dynamic = "force-dynamic";

type Anuncio = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number;
  provincia?: string;
  ciudad?: string;
  telefono?: string;
  whatsapp?: string;
  fotos?: string[];
  createdAt: string;
  updatedAt?: string;
};

async function getAnuncios(): Promise<Anuncio[]> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${base}/api/anuncios`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { ok: boolean; anuncios?: Anuncio[] };
  return data.anuncios ?? [];
}

export default async function Page() {
  const anuncios = await getAnuncios();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>PuraVenta</h1>

      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Anuncios publicados: <b>{anuncios.length}</b>
      </p>

      {anuncios.length === 0 ? (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          No hay anuncios todavía.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {anuncios.map((a) => (
            <article
              key={a.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 90,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #eee",
                  background: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                {a.fotos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.fotos[0]}
                    alt={a.titulo ?? "Anuncio"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  "Sin foto"
                )}
              </div>

              <div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {a.titulo || "Sin título"}
                  </h2>
                  {typeof a.precio === "number" && (
                    <span style={{ fontWeight: 700 }}>{a.precio} ₡</span>
                  )}
                  {a.provincia && (
                    <span style={{ fontSize: 12, padding: "2px 8px", border: "1px solid #ddd", borderRadius: 999 }}>
                      {a.provincia}
                    </span>
                  )}
                </div>

                {a.descripcion && (
                  <p style={{ margin: "8px 0 0", opacity: 0.85 }}>{a.descripcion}</p>
                )}

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  ID: {a.id} · {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
