// src/pages/Services.tsx
import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { ServiceCard } from "../components/ServiceCard";
import type { Service } from "../types";
import { useAuth } from "../context/AuthContext";
import { makeServicesApi } from "../api/services.api";
import { CategoryService, getCategoryServiceLabel } from "../data/categoryService";

export default function Services() {
  const { authFetch } = useAuth();
  const api = useMemo(() => makeServicesApi(authFetch), [authFetch]);

  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [comingSoonServices, setComingSoonServices] = useState<Service[]>([]);
  const [filteredActive, setFilteredActive] = useState<Service[]>([]);
  const [filteredSoon, setFilteredSoon] = useState<Service[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Cargar lista desde el backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await api.listServicesUI({ include_inactive: true, all: true });
        const avail = data.filter((s) => s.active);
        const soon = data.filter((s) => !s.active || s.isComingSoon);

        setAvailableServices(avail);
        setComingSoonServices(soon);
      } catch (e: any) {
        setErr(e?.message || "No se pudo cargar servicios");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [api]);

  // Filtro por categoría en ambas listas
  useEffect(() => {
    const match = (cat?: string) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "uncategorized") return !cat || cat === "";
      return (cat ?? "") === categoryFilter;
    };

    setFilteredActive(availableServices.filter((s) => match(s.category)));
    setFilteredSoon(comingSoonServices.filter((s) => match(s.category)));
  }, [categoryFilter, availableServices, comingSoonServices]);

  // Opciones del filtro: All + categorías del catálogo + "uncategorized" si hay
  const hasUncategorized =
    availableServices.some((s) => !s.category || s.category === "") ||
    comingSoonServices.some((s) => !s.category || s.category === "");

  const categoryOptions = useMemo(
    () => [
      { id: "all", label: "All" },
      ...CategoryService.map((c) => ({ id: c.id, label: c.description })),
      ...(hasUncategorized ? [{ id: "uncategorized", label: "Uncategorized" }] : []),
    ],
    [hasUncategorized]
  );

  // Título amigable de la categoría seleccionada (opcional)
  const currentCategoryLabel =
    categoryFilter === "all"
      ? "All"
      : categoryFilter === "uncategorized"
      ? "Uncategorized"
      : getCategoryServiceLabel(categoryFilter) || categoryFilter;

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Our Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From hair styling to skin treatments, explore our range of premium beauty services
            designed to enhance your natural beauty and provide a luxurious experience.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Filtros de categoría (arriba, como lo tenías) */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categoryOptions.map((opt) => (
              <button
                key={opt.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === opt.id
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setCategoryFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Estados */}
          {loading && <div className="text-center py-12">Loading…</div>}
          {err && !loading && <div className="text-center py-12 text-red-600">{err}</div>}

          {/* Contenido */}
          {!loading && !err && (
            <>
              {/* Activos filtrados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredActive.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>

              {filteredActive.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No services found for “{currentCategoryLabel}”.
                  </p>
                </div>
              )}

              {/* Coming Soon filtrados por la misma categoría */}
              {filteredSoon.length > 0 && (
                <div className="mt-24">
                  <h2 className="text-center mb-12">
                    Coming Soon{categoryFilter !== "all" ? ` – ${currentCategoryLabel}` : ""}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSoon.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
