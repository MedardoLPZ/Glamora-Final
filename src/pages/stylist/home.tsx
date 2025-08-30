import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Scissors,
  Users,
  Calendar,
  UserPlus,
  Plus,
  AlertCircle,
  LogOut,
  Phone,
  Mail,
} from "lucide-react";

import { AppointmentRequestCard } from "./AppointmentRequestCard";
import { StylistModal } from "./StylistModal";
import { ProductModal } from "./ProductModal";
import ServicesModal, { Service as ModalSvc } from "./ServicesModal";

// tipos del app
import type { Appointment, ProductOrder, Product } from "../../types";

type AppStylist = {
  id: string;
  name: string;
  specialties?: string[];
  photo?: string;
  bio?: string;
  img?: string;
};

import { makeStylistsApi } from "../../api/stylist.api";

// Usuario/cliente proveniente del backend
import {
  listClientsInfoCached,
  clearClientsInfoCache,
  type ClientUser,
} from "../../api/users.api";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost/glamora-bk/public/api";

function Home() {
  const navigate = useNavigate();
  const { logout, authFetch } = useAuth();

  const api = useMemo(() => makeStylistsApi(authFetch), [authFetch]);

  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [productOrders] = useState<ProductOrder[]>([]);
  const [stylists, setStylists] = useState<AppStylist[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ModalSvc[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);

  // Modals
  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [showServices, setShowServices] = useState(false);

  // CLIENTES desde backend (/users/info) forzando refetch para evitar caché viejo
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        clearClientsInfoCache();
        const list = await listClientsInfoCached({
          fetcher: authFetch,
          forceRefresh: true,
          ttlMs: 0,
        });
        if (alive) setClients(list);
      } catch (e) {
        console.error("users/info error:", e);
        if (alive) setClients([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authFetch]);

  // ESTILISTAS desde API
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listStylistsUI({ all: true });
        setStylists(
          data.map((d: any) => ({
            id: String(d.id),
            name: String(d.name),
            specialties: d.specialty ? [d.specialty] : [],
            photo: d.image ?? "",
            bio: d.bio ?? "",
            img: d.image ?? "",
          }))
        );
      } catch {
        setStylists([]);
      }
    })();
  }, [api]);

  // Búsqueda local sobre clients (backend)
  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [clients, searchTerm]);

  const pendingAppointments = useMemo(
    () => appointments.filter((apt) => apt.status === "pending"),
    [appointments]
  );

  // Stats (dejamos Total y Upcoming para las dos mitades)
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const upcomingAppointments = appointments.filter((a) => a.status === "confirmed").length;
    const pendingOrders = productOrders.filter((o: any) => (o as any).status === "pending").length;
    const pendingRequests = appointments.filter((a) => a.status === "pending").length;
    return { totalClients, upcomingAppointments, pendingOrders, pendingRequests };
  }, [clients.length, appointments, productOrders]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // --- handlers
  const handleAcceptAppointment = (id: string) =>
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
    );

  const handleDeclineAppointment = (id: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));

  const handleCancelAppointment = (id: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));

  const handleRebookAppointment = (id: string, date: string, time: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, date, time } : a)));

  const handleAddProduct = (newProduct: Omit<Product, "id">) =>
    setProducts((prev) => [...prev, { id: Date.now().toString(), ...newProduct }]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Salon Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your clients and appointments</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStylistModalOpen(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <UserPlus size={18} />
                <span>Stylists</span>
              </button>

              <button
                onClick={() => setProductModalOpen(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>Products</span>
              </button>

              <button
                onClick={() => setShowServices(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Services</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 2 tarjetas: mitad y mitad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <StatCard icon={<Users className="h-6 w-6 text-blue-600" />} label="Total Clients" value={stats.totalClients} bg="bg-blue-100" />
          <StatCard icon={<Calendar className="h-6 w-6 text-green-600" />} label="Upcoming Appointments" value={stats.upcomingAppointments} bg="bg-green-100" />
        </div>

        {/* Appointment Requests (si los usas) */}
        {pendingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-3 text-red-500" size={24} />
              Appointment Requests ({pendingAppointments.length})
            </h2>
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => {
                const client = clients.find((c) => c.id === String((appointment as any).userId));
                const stylist = stylists.find((s) => s.id === String((appointment as any).stylistId));
                if (!client) return null;
                return (
                  <AppointmentRequestCard
                    key={appointment.id}
                    appointment={appointment}
                    client={client as any}
                    stylist={stylist as any}
                    onAccept={handleAcceptAppointment}
                    onDecline={handleDeclineAppointment}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Client list: SOLO nombre, teléfono y correo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredClients.map((client) => (
            <SimpleClientCard key={client.id} client={client} />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StylistModal isOpen={stylistModalOpen} onClose={() => setStylistModalOpen(false)} />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAddProduct={(newProduct) =>
          setProducts((prev) => [...prev, { id: Date.now().toString(), ...newProduct }])
        }
        onUpdateProducts={setProducts}
        products={products}
      />

      {showServices && (
        <ServicesModal
          isOpen={showServices}
          services={services}
          onClose={() => setShowServices(false)}
          onSave={(next) => setServices(next)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center">
        <div className={`${bg} p-3 rounded-lg`}>{icon}</div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta ligera: solo nombre, teléfono y correo */
function SimpleClientCard({ client }: { client: ClientUser }) {
  const initials = (client.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "CU";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-pink-500 text-white p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight truncate">{client.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-90">
            <span className="flex items-center gap-1">
              <Phone size={14} /> {client.phone || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Mail size={14} /> {client.email || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
