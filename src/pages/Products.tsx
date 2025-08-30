import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { makeProductsApi } from "../api/product.api";
// ✅ Import correcto (minúsculas y con 't')
import { CategoryProduct, getCategoryProductLabel } from "../data/categoryProduc";

export default function Products() {
  const { authFetch } = useAuth();
  const api = useMemo(() => makeProductsApi(authFetch), [authFetch]);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Cargar catálogo público (solo in_stock=true)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.listPublicProductsUI({ all: true });
        if (!mounted) return;

        // Mapea UIProduct -> Product (Product requiere 'image')
        const mapped: Product[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category ?? "",
          description: p.description ?? "",
          inStock: p.inStock,
          image: p.image ?? "", // 👈 CLAVE: ahora sí cumple con tu tipo Product
        }));

        setDbProducts(mapped);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar el catálogo.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [api]);

  // Categorías para filtros
  const presentIds = Array.from(
    new Set(dbProducts.map((p) => (p.category && p.category !== "" ? p.category : "others")))
  );

  const knownIds = CategoryProduct.map((c) => c.id);
  const knownPresent = knownIds.filter((id) => presentIds.includes(id));
  const unknownPresent = presentIds.filter((id) => id !== "others" && !knownIds.includes(id));
  const hasOthers = presentIds.includes("others");

  const categories: string[] = [
    "all",
    ...knownPresent,
    ...unknownPresent,
    ...(hasOthers ? ["others"] : []),
  ];

  const labelFor = (id: string) => {
    if (id === "all") return "All";
    if (id === "others") return "Others";
    return getCategoryProductLabel(id) || `Category ${id}`;
  };

  const filteredProducts =
    categoryFilter === "all"
      ? dbProducts
      : dbProducts.filter((p) => (p.category || "others") === categoryFilter);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Beauty Products</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our collection of premium beauty products carefully selected to help you
            maintain your salon look at home. All products are cruelty-free and made with
            high-quality ingredients.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="section">
        <div className="container">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              {error}
            </div>
          )}

          {/* Filtros arriba */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setCategoryFilter(category)}
              >
                {labelFor(category)}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-12 text-gray-500">Loading products…</div>}

          {!loading && filteredProducts.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found for this category.</p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
