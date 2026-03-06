import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function Page({ params }: { params: { id: string } }) {
  const anuncio = await redis.get(`anuncio:${params.id}`);

  if (!anuncio) {
    return <div style={{ padding: 40 }}>Anuncio no encontrado</div>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{(anuncio as any).titulo}</h1>

      {(anuncio as any).fotos?.length > 0 && (
        <img
          src={(anuncio as any).fotos[0]}
          style={{ width: 400, borderRadius: 10 }}
        />
      )}

      <p>
        <b>Precio:</b> ₡{(anuncio as any).precio}
      </p>

      <p>{(anuncio as any).descripcion}</p>

      <a
        href={`https://wa.me/${(anuncio as any).whatsapp}`}
        target="_blank"
      >
        Contactar por WhatsApp
      </a>
    </main>
  );
}