import React, { useState } from 'react';
import { Calendar, Clock, Phone, Mail, Package, MoreHorizontal, X, RotateCcw } from 'lucide-react';
import { Client, Appointment, ProductOrder } from '../types/salon';
import { RebookModal } from './RebookModal';

interface ClientCardProps {
  client: Client;
  appointments: Appointment[];
  productOrders: ProductOrder[];
  onCancelAppointment: (appointmentId: string) => void;
  onRebookAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  appointments,
  productOrders,
  onCancelAppointment,
  onRebookAppointment,
}) => {
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [rebookModalOpen, setRebookModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled').slice(0, 3);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Client Header */}
      <div className="bg-pink-500 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">
              {client.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold">{client.name}</h3>
            <div className="flex items-center space-x-4 mt-2 text-white/90">
              <div className="flex items-center space-x-1">
                <Phone size={14} />
                <span className="text-sm">{client.phone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail size={14} />
                <span className="text-sm">{client.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Upcoming Appointments */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Calendar className="mr-2" size={18} />
            Upcoming Appointments
          </h4>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{appointment.service}</h5>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock size={14} className="mr-1" />
                        {formatDate(appointment.date)} at {appointment.time}
                      </div>
                      <div className="text-sm text-blue-600 font-medium mt-1">
                        ${appointment.price} • {appointment.duration}min
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{appointment.notes}"</p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setExpandedAppointment(
                          expandedAppointment === appointment.id ? null : appointment.id
                        )}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {expandedAppointment === appointment.id && (
                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setRebookModalOpen(true);
                              setExpandedAppointment(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-blue-600"
                          >
                            <RotateCcw size={16} />
                            <span>Rebook</span>
                          </button>
                          <button
                            onClick={() => {
                              onCancelAppointment(appointment.id);
                              setExpandedAppointment(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                          >
                            <X size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
              No upcoming appointments
            </p>
          )}
        </div>

        {/* Previous Appointments */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Recent History</h4>
          {pastAppointments.length > 0 ? (
            <div className="space-y-2">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-medium text-gray-800">{appointment.service}</h5>
                      <div className="text-sm text-gray-600">
                        {formatDate(appointment.date)} • ${appointment.price}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
              No previous appointments
            </p>
          )}
        </div>

        {/* Product Orders */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Package className="mr-2" size={18} />
            Product Orders
          </h4>
          {productOrders.length > 0 ? (
            <div className="space-y-2">
              {productOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800">{order.productName}</h5>
                      <div className="text-sm text-gray-600 mt-1">
                        Qty: {order.quantity} • ${order.price} • {formatDate(order.orderDate)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
              No product orders
            </p>
          )}
        </div>
      </div>

      {selectedAppointment && (
        <RebookModal
          appointment={selectedAppointment}
          isOpen={rebookModalOpen}
          onClose={() => {
            setRebookModalOpen(false);
            setSelectedAppointment(null);
          }}
          onRebook={onRebookAppointment}
        />
      )}
    </div>
  );
};