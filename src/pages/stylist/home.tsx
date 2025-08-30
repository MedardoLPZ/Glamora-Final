import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Search, Scissors, Users, Calendar, Package, UserPlus, Plus, AlertCircle, LogOut,
} from "lucide-react";

import { ClientCard } from "./ClientCard";
import { AppointmentRequestCard } from "./AppointmentRequestCard";
import { StylistModal, type Stylist as ModalStylist } from "./StylistModal";
import { ProductModal } from "./ProductModal";
import ServicesModal, { Service as ModalSvc } from "./ServicesModal";

import {
  mockClients, mockAppointments, mockProductOrders, mockStylists, mockProducts,
} from "../../data/mockData";

// 👇 tipos del app (tu estado global/local)
import type { Appointment, ProductOrder, Product } from "../../types/salon";
type AppStylist = {
  id: string;
  name: string;
  specialties?: string[];
  photo?: string;
  // opcional si quieres conservar bio/img en tu estado:
  bio?: string;
  img?: string;
};

import { makeStylistsApi } from "../../api/stylist.api";

type UserOption = { id: string; name: string; email?: string };

function Home() {
  const navigate = useNavigate();
  const { logout, authFetch } = useAuth();

  const api = useMemo(() => makeStylistsApi(authFetch), [authFetch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [productOrders] = useState<ProductOrder[]>(mockProductOrders);

  // estado estilistas en el app
  const [stylists, setStylists] = useState<AppStylist[]>(mockStylists as unknown as AppStylist[]);

  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [services, setServices] = useState<ModalSvc[]>([]);

  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [showServices, setShowServices] = useState(false);

  // usuarios para el combobox del modal
  const [users, setUsers] = useState<UserOption[]>([]);

  // Cargar usuarios (ajusta la ruta a tu API real)
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/users?all=1");
        const j = await res.json();
        setUsers(j.map((u: any) => ({ id: String(u.id), name: u.name, email: u.email })));
      } catch {
        setUsers([]);
      }
    })();
  }, [authFetch]);

  // (OPCIONAL) refrescar estilistas desde backend para no depender del mock
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listStylistsUI({ all: true });
        setStylists(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            specialties: d.specialty ? [d.specialty] : [],
            photo: d.image ?? "",
            bio: (d as any).bio ?? "",
            img: d.image ?? "",
          }))
        );
      } catch {
        // si falla, te quedas con el mock
      }
    })();
  }, [api]);

  const filteredClients = React.useMemo(() => {
    return mockClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );
  }, [searchTerm]);

  const pendingAppointments = React.useMemo(
    () => appointments.filter((apt) => apt.status === "pending"),
    [appointments]
  );

  const stats = React.useMemo(() => {
    const totalClients = mockClients.length;
    const upcomingAppointments = appointments.filter((a) => a.status === "upcoming").length;
    const pendingOrders = productOrders.filter((o) => o.status === "pending").length;
    const pendingRequests = appointments.filter((a) => a.status === "pending").length;
    return { totalClients, upcomingAppointments, pendingOrders, pendingRequests };
  }, [appointments, productOrders]);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  };

  // --- handlers mock (sin cambios)
  const handleAcceptAppointment = (id: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "upcoming" } : a)));
  const handleDeclineAppointment = (id: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  const handleCancelAppointment = (id: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  const handleRebookAppointment = (id: string, date: string, time: string) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, date, time } : a)));

  // ----- App <-> Modal mapeos -----
  const modalStylists: ModalStylist[] = stylists.map((s) => ({
    id: s.id,
    name: s.name,
    specialty: s.specialties?.[0] ?? "",
    bio: s.bio ?? "",
    img: s.img ?? s.photo ?? "",
  }));

  function toAppStylists(rows: ModalStylist[]): AppStylist[] {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      specialties: r.specialty ? [r.specialty] : [],
      photo: r.img ?? "",
      bio: r.bio ?? "",
      img: r.img ?? "",
    }));
  }

  // Crear estilista usando la API (recibe payload del modal)
  const handleCreateStylist: React.ComponentProps<typeof StylistModal>["onAddStylist"] =
    async ({ user_id, specialty, bio, img }) => {
      // crea (img va como "file" dentro del cliente API)
      await api.createStylist({
        user_id,
        specialty,
        active: true,
        img: img ?? undefined,
      });

      // si tu backend ya soporta bio en POST, descomenta:
      if (bio && (api as any).updateStylist) {
        try {
          // actualiza nota: si el create no devuelve el ID cómodamente,
          // refrescamos todo y no hacemos este update extra.
        } catch {}
      }

      // refrescamos desde backend
      const { data } = await api.listStylistsUI({ all: true });
      setStylists(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          specialties: d.specialty ? [d.specialty] : [],
          photo: d.image ?? "",
          bio: (d as any).bio ?? "",
          img: d.image ?? "",
        }))
      );
    };

  // Productos (sin cambios)
  const handleAddProduct = (newProduct: Omit<Product, "id">) =>
    setProducts((prev) => [...prev, { ...newProduct, id: Date.now().toString() }]);

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
                <UserPlus size={18} /><span>Manage Stylists</span>
              </button>

              <button
                onClick={() => setProductModalOpen(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} /><span>Manage Products</span>
              </button>

              <button
                onClick={() => setShowServices(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Plus size={18} /><span>Manage Services</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <LogOut size={18} /><span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<AlertCircle className="h-6 w-6 text-red-600" />} label="Pending Requests" value={stats.pendingRequests} bg="bg-red-100" />
          <StatCard icon={<Users className="h-6 w-6 text-blue-600" />} label="Total Clients" value={stats.totalClients} bg="bg-blue-100" />
          <StatCard icon={<Calendar className="h-6 w-6 text-green-600" />} label="Upcoming Appointments" value={stats.upcomingAppointments} bg="bg-green-100" />
          <StatCard icon={<Package className="h-6 w-6 text-purple-600" />} label="Pending Orders" value={stats.pendingOrders} bg="bg-purple-100" />
        </div>

        {/* Appointment Requests */}
        {pendingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-3 text-red-500" size={24} />
              Appointment Requests ({pendingAppointments.length})
            </h2>
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => {
                const client = mockClients.find((c) => c.id === appointment.clientId);
                const stylist = stylists.find((s) => s.id === appointment.stylistId);
                if (!client) return null;
                return (
                  <AppointmentRequestCard
                    key={appointment.id}
                    appointment={appointment}
                    client={client}
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

        {/* Client Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredClients.map((client) => {
            const clientAppointments = appointments.filter((a) => a.clientId === client.id);
            const clientOrders = productOrders.filter((o) => o.clientId === client.id);
            return (
              <ClientCard
                key={client.id}
                client={client}
                appointments={clientAppointments}
                productOrders={clientOrders}
                onCancelAppointment={handleCancelAppointment}
                onRebookAppointment={handleRebookAppointment}
              />
            );
          })}
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
      <StylistModal
        isOpen={stylistModalOpen}
        onClose={() => setStylistModalOpen(false)}
      />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAddProduct={(newProduct) =>
          setProducts((prev) => [...prev, { ...newProduct, id: Date.now().toString() }])
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
  icon, label, value, bg,
}: { icon: React.ReactNode; label: string; value: number; bg: string }) {
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

export default Home;
