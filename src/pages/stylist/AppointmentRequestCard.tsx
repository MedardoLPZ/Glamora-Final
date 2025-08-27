import React from 'react';
import { Clock, User, Calendar, DollarSign, Check, X } from 'lucide-react';
import { Appointment, Client, Stylist } from '../types/salon';

interface AppointmentRequestCardProps {
  appointment: Appointment;
  client: Client;
  stylist?: Stylist;
  onAccept: (appointmentId: string) => void;
  onDecline: (appointmentId: string) => void;
}

export const AppointmentRequestCard: React.FC<AppointmentRequestCardProps> = ({
  appointment,
  client,
  stylist,
  onAccept,
  onDecline,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">New Appointment Request</h3>
            <p className="text-sm text-gray-600">Requires your approval</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onAccept(appointment.id)}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors flex items-center space-x-1"
          >
            <Check size={16} />
            <span className="text-sm font-medium">Accept</span>
          </button>
          <button
            onClick={() => onDecline(appointment.id)}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors flex items-center space-x-1"
          >
            <X size={16} />
            <span className="text-sm font-medium">Decline</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <User size={16} className="text-gray-500" />
            <span className="font-medium text-gray-900">{client.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-gray-700">{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-gray-500" />
            <span className="text-gray-700">{appointment.time} ({appointment.duration} min)</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{appointment.service}</span>
          </div>
          {stylist && (
            <div className="text-sm text-gray-600">
              Stylist: {stylist.name}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <DollarSign size={16} className="text-gray-500" />
            <span className="font-medium text-green-600">${appointment.price}</span>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-gray-700 italic">"{appointment.notes}"</p>
        </div>
      )}
    </div>
  );
};