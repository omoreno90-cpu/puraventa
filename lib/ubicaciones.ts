export const PROVINCIAS = [
  "San José",
  "Heredia",
  "Alajuela",
  "Cartago",
  "Guanacaste",
  "Puntarenas",
  "Limón",
] as const;

export const CANTONES: Record<(typeof PROVINCIAS)[number], string[]> = {
  "San José": [
    "San José",
    "Escazú",
    "Santa Ana",
    "Desamparados",
    "Curridabat",
    "Goicoechea",
    "Moravia",
    "Tibás",
    "Montes de Oca (San Pedro)",
  ],
  "Heredia": ["Heredia", "Belén", "Santo Domingo", "San Pablo", "San Rafael", "Barva"],
  "Alajuela": ["Alajuela", "San Ramón", "Grecia", "Atenas"],
  "Cartago": ["Cartago", "La Unión", "Paraíso", "Oreamuno"],
  "Guanacaste": ["Liberia", "Nicoya", "Santa Cruz", "Tamarindo", "Santa Teresa", "Cañas"],
  "Puntarenas": ["Puntarenas", "Quepos", "Jacó", "Golfito", "Miramar", "Monteverde"],
  "Limón": ["Limón", "Guápiles", "Puerto Viejo"],
};
