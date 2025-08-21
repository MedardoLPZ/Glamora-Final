import { Appointment } from '../types';

export const getSampleAppointments = (userId: string): Appointment[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return [
    {
      id: '1',
      userId,
      serviceId: '1',
      stylistId: '1',
      date: formatDate(tomorrow),
      time: '10:00 AM',
      status: 'upcoming',
      serviceName: 'Women\'s Eyelashes',
      price: 65,
      stylistName: 'Angie',
      notes: '...',
    },
    {
      id: '2',
      userId,
      serviceId: '4',
      stylistId: '3',
      date: formatDate(nextWeek),
      time: '2:30 PM',
      status: 'upcoming',
      serviceName: 'Classic Manicure',
      price: 35,
      stylistName: 'Katherine',
    },
    {
      id: '3',
      userId,
      serviceId: '6',
      stylistId: '4',
      date: formatDate(lastWeek),
      time: '1:00 PM',
      status: 'completed',
      serviceName: 'European Facial',
      price: 75,
      stylistName: 'Nataly',
    },
    {
      id: '4',
      userId,
      serviceId: '3',
      stylistId: '1',
      date: formatDate(new Date(today.setMonth(today.getMonth() - 1))),
      time: '11:30 AM',
      status: 'completed',
      serviceName: 'Hair Coloring',
      price: 85,
      stylistName: 'Nataly',
    },
  ];
};