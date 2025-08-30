// src/data/CategoryService.ts
// Si ya tienes el tipo en ../types, importa y borra la línea de abajo.
// import type { Category } from "../types";

// Fallback por si no existe en ../types:
export type Product = { id: string; description: string };

export const CategoryProduct: Product[] = [
  { id: "1", description: "Hair" },
  { id: "2", description: "Skin" },
];

export function getCategoryProductLabel(id?: string) {
  if (!id) return "";
  return CategoryProduct.find((c) => c.id === id)?.description ?? "";
}
