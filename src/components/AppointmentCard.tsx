import { Appointment } from '../types';
import { formatPrice } from '../lib/utils';
import { Button } from './ui/Button';
import { Calendar, Clock, User } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const statusColors = {
    upcoming: 'bg-primary-100 text-primary-800',
    completed: 'bg-success-100 text-success-800',
    cancelled: 'bg-error-100 text-error-800',
  };
  
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-lg">{appointment.serviceName}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-primary-500" />
          <span>{appointment.date}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-primary-500" />
          <span>{appointment.time}</span>
        </div>
        
        {appointment.stylistName && (
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2 text-primary-500" />
            <span>{appointment.stylistName}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="font-semibold">{formatPrice(appointment.price)}</span>
        
        {appointment.status === 'upcoming' && onCancel && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCancel(appointment.id)}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}