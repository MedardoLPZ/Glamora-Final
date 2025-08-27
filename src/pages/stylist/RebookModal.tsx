import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Appointment } from '../types/salon';

interface RebookModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onRebook: (appointmentId: string, newDate: string, newTime: string) => void;
}

export const RebookModal: React.FC<RebookModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onRebook,
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && newTime) {
      onRebook(appointment.id, newDate, newTime);
      onClose();
      setNewDate('');
      setNewTime('');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-pink-500 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Rebook Appointment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Appointments</h3>
            <p className="text-gray-600">{appointment.service}</p>
            <p className="text-sm text-gray-500">
              {new Date(appointment.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })} at {appointment.time}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-2" size={16} />
                New Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline mr-2" size={16} />
                New Time
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Select Time</option>
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                Rebook Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};