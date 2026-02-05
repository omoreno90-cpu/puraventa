// lib/anunciosStore.ts

export type Anuncio = {
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

declare global {
  // eslint-disable-next-line no-var
  var __PURAVENTA_ANUNCIOS__: Map<string, Anuncio> | undefined;
}

export function getAnunciosStore(): Map<string, Anuncio> {
  if (!globalThis.__PURAVENTA_ANUNCIOS__) {
    globalThis.__PURAVENTA_ANUNCIOS__ = new Map<string, Anuncio>();
  }
  return globalThis.__PURAVENTA_ANUNCIOS__!;
}
