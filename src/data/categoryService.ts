// src/data/CategoryService.ts
// Si ya tienes el tipo en ../types, importa y borra la línea de abajo.
// import type { Category } from "../types";

// Fallback por si no existe en ../types:
export type Category = { id: string; description: string };

export const CategoryService: Category[] = [
  { id: "1", description: "Hair" },
  { id: "2", description: "Skin" },
  { id: "3", description: "Nails" },
  { id: "4", description: "Lashes" },
  { id: "5", description: "Makeup" },
];

export function getCategoryServiceLabel(id?: string) {
  if (!id) return "";
  return CategoryService.find((c) => c.id === id)?.description ?? "";
}
