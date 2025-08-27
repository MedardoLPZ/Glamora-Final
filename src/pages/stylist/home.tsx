import ServicesModal from "./ServicesModal"; // modal for services
import { initialServices, type Service2 } from "../../data/services2";
import React, { useState, useMemo } from "react";
import {
  Search,
  Scissors,
  Users,
  Calendar,
  Package,
  UserPlus,
  Plus,
  AlertCircle,
  LogOut, // 👈 HomeIcon eliminado
} from "lucide-react";
import { ClientCard } from "./ClientCard";
import { AppointmentRequestCard } from "./AppointmentRequestCard";
import { StylistModal } from "./StylistModal";
import { ProductModal } from "./ProductModal";
import {
  mockClients,
  mockAppointments,
  mockProductOrders,
  mockStylists,
  mockProducts,
} from "../../data/mockData";
import { Appointment, ProductOrder, Stylist, Product } from "../../types/salon";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
// Si quieres usar toast, descomenta la línea y ajusta el path si es necesario
// import { toast } from "../../components/ui/Toaster";

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>(
    mockAppointments
  );
  const [productOrders] = useState<ProductOrder[]>(mockProductOrders);
  const [stylists, setStylists] = useState<Stylist[]>(mockStylists);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  // NEW: services + modal state
  const [showServices, setShowServices] = useState(false);
  const [services, setServices] = useState<Service2[]>(initialServices);

  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    return mockClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );
  }, [searchTerm]);

  const pendingAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.status === "pending");
  }, [appointments]);

  const handleAcceptAppointment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "upcoming" as const } : apt
      )
    );
  };

  const handleDeclineAppointment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "cancelled" as const } : apt
      )
    );
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "cancelled" as const } : apt
      )
    );
  };

  const handleRebookAppointment = (
    appointmentId: string,
    newDate: string,
    newTime: string
  ) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, date: newDate, time: newTime } : apt
      )
    );
  };

  const handleAddStylist = (newStylist: Omit<Stylist, "id">) => {
    const stylist: Stylist = {
      ...newStylist,
      id: Date.now().toString(),
    };
    setStylists((prev) => [...prev, stylist]);
  };

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    const product: Product = {
      ...newProduct,
      id: Date.now().toString(),
    };
    setProducts((prev) => [...prev, product]);
  };

  const stats = useMemo(() => {
    const totalClients = mockClients.length;
    const upcomingAppointments = appointments.filter(
      (apt) => apt.status === "upcoming"
    ).length;
    const pendingOrders = productOrders.filter(
      (order) => order.status === "pending"
    ).length;
    const pendingRequests = appointments.filter(
      (apt) => apt.status === "pending"
    ).length;

    return { totalClients, upcomingAppointments, pendingOrders, pendingRequests };
  }, [appointments, productOrders]);

  // ✅ Logout bien hecho: espera, limpia sesión, redirige
  const handleLogout = async () => {
    try {
      await logout();
      // toast?.("Sesión cerrada", "success");
    } catch {
      // toast?.("No se pudo cerrar sesión", "error");
    } finally {
      navigate("/login", { replace: true });
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">
                  Salon Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your clients and appointments
                </p>
              </div>
            </div>

            {/* Botones de acción (Home removido) */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStylistModalOpen(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <UserPlus size={18} />
                <span>Manage Stylists</span>
              </button>

              <button
                onClick={() => setProductModalOpen(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>Manage Products</span>
              </button>

              <button
                onClick={() => setShowServices(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>Manage Services</span>
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

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingRequests}
                </p>
                <p className="text-gray-600">Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalClients}
                </p>
                <p className="text-gray-600">Total Clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.upcomingAppointments}
                </p>
                <p className="text-gray-600">Upcoming Appointments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingOrders}
                </p>
                <p className="text-gray-600">Pending Orders</p>
              </div>
            </div>
          </div>
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
                    stylist={stylists.find((s) => s.id === appointment.stylistId)}
                    onAccept={handleAcceptAppointment}
                    onDecline={handleDeclineAppointment}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
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
            const clientAppointments = appointments.filter(
              (apt) => apt.clientId === client.id
            );
            const clientOrders = productOrders.filter(
              (order) => order.clientId === client.id
            );

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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clients found
              </h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StylistModal
        isOpen={stylistModalOpen}
        onClose={() => setStylistModalOpen(false)}
        onAddStylist={handleAddStylist}
        stylists={stylists}
        onUpdateStylists={setStylists}
      />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAddProduct={handleAddProduct}
        onUpdateProducts={setProducts}
        products={products}
      />

      {/* NEW ServicesModal */}
      {showServices && (
        <ServicesModal
          isOpen={showServices}
          services={services}
          onClose={() => setShowServices(false)}
          onSave={(next) => {
            setServices(next);
            setShowServices(false);
          }}
        />
      )}
    </div>
  );
}

export default Home;
