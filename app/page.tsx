// app/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";

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

async function getAnuncios(): Promise<{ anuncios: Anuncio[]; debug?: string }> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";

    if (!host) return { anuncios: [], debug: "No host header" };

    const url = `${proto}://${host}/api/anuncios`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return { anuncios: [], debug: `Fetch failed: ${res.status} ${res.statusText} (${url})` };
    }

    const data = (await res.json()) as { ok: boolean; anuncios?: Anuncio[] };
    return { anuncios: data.anuncios ?? [], debug: `OK (${url})` };
  } catch (e: any) {
    return { anuncios: [], debug: `Exception: ${e?.message ?? String(e)}` };
  }
}

export default async function HomePage() {
  const { anuncios, debug } = await getAnuncios();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>PuraVenta</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
            Anuncios: <b>{anuncios.length}</b>
          </p>
          {debug && (
            <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.55 }}>
              {debug}
            </p>
          )}
        </div>

        <a
          href="/publicar"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Publicar
        </a>
      </header>

      <section style={{ marginTop: 16 }}>
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
                  borderRadius: 14,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 105,
                    borderRadius: 12,
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
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                      {a.titulo || "Sin título"}
                    </h2>

                    {typeof a.precio === "number" && (
                      <span style={{ fontWeight: 800 }}>{a.precio} ₡</span>
                    )}

                    {a.provincia && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 999,
                          opacity: 0.9,
                        }}
                      >
                        {a.provincia}
                      </span>
                    )}
                  </div>

                  {a.descripcion && (
                    <p style={{ margin: "8px 0 0", opacity: 0.85 }}>{a.descripcion}</p>
                  )}

                  {a.whatsapp && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={`https://wa.me/506${encodeURIComponent(a.whatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 700, textDecoration: "none" }}
                      >
                        WhatsApp: {a.whatsapp}
                      </a>
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
