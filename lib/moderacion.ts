export type MotivoBloqueo =
  | "sexo"
  | "animales"
  | "estafa"
  | "ilegal"
  | "spam"
  | "otro";

export type ResultadoModeracion = {
  ok: boolean;
  motivo?: MotivoBloqueo;
  mensaje?: string;
};

function normalizar(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita tildes
}

const PATRONES: Array<{
  motivo: MotivoBloqueo;
  // patrones con palabras típicas (incluye CR)
  re: RegExp[];
  mensaje: string;
}> = [
  {
    motivo: "animales",
    re: [
      /\b(perro|perros|gato|gatos|cachorro|cachorros|gatito|gatitos|mascota|mascotas)\b/i,
      /\b(adopcion|adoptar|regalo|vendo cachorro|vendo perro|vendo gato)\b/i,
      /\b(jaula|kennel)\b/i,
    ],
    mensaje:
      "No se permite publicar animales (venta/regalo/adopción) en PuraVenta.",
  },
  {
    motivo: "sexo",
    re: [
      /\b(escorts?|escort|prepago|pre pago|masajista)\b/i,
      /\b(sexo|sexual|oral|anal|fetiche|xxx|porn|porno)\b/i,
      /\b(servicios? (sexuales|eroticos|eroticas))\b/i,
      /\b(acompanante|acompañante)\b/i,
      /\b(happy ending|final feliz)\b/i,
      // jerga muy común
      /\b(discrecion|discrecion total)\b/i,
    ],
    mensaje:
      "No se permite contenido sexual ni oferta de servicios sexuales.",
  },
  {
    motivo: "estafa",
    re: [
      /\b(deposito|dep[oó]sito|adelanto|anticipo|reservar con)\b/i,
      /\b(envio|envi(o|́)s)\b/i,
      /\b(solo sinpe|sinpe movil|sinpe)\b/i,
      /\b(transferencia inmediata|pago por adelantado)\b/i,
      /\b(whatsapp(?!\s*opcional))/i,
      /\b(too good to be true|demasiado barato)\b/i,
      /\b(link|enlace)\b/i,
    ],
    mensaje:
      "Este anuncio parece incluir señales de estafa (depósitos/adelantos/enlaces). Revisa el texto.",
  },
];

export function moderarTexto(input: {
  titulo: string;
  descripcion: string;
  categoria: string;
}): ResultadoModeracion {
  const blob = normalizar(
    `${input.titulo}\n${input.descripcion}\n${input.categoria}`
  );

  // filtro básico de longitud
  if (normalizar(input.titulo).trim().length < 5) {
    return { ok: false, motivo: "otro", mensaje: "El título debe tener al menos 5 caracteres." };
  }

  for (const grupo of PATRONES) {
    for (const r of grupo.re) {
      if (r.test(blob)) {
        return { ok: false, motivo: grupo.motivo, mensaje: grupo.mensaje };
      }
    }
  }

  return { ok: true };
}
