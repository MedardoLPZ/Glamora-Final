import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { AppointmentCard } from '../components/AppointmentCard';
import { useAuth } from '../context/AuthContext';
import { getSampleAppointments } from '../data/appointments';
import { Appointment } from '../types';
import { toast } from '../components/ui/Toaster';
import { Calendar } from 'lucide-react';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  
  useEffect(() => {
    if (user) {
      // In a real app, this would fetch the user's appointments from an API
      const allAppointments = getSampleAppointments(user.id);
      setAppointments(allAppointments);
      
      // Separate upcoming and past appointments
      setUpcomingAppointments(
        allAppointments.filter((appointment) => appointment.status === 'upcoming')
      );
      
      setPastAppointments(
        allAppointments.filter((appointment) => appointment.status !== 'upcoming')
      );
    }
  }, [user]);
  
  const handleCancelAppointment = (id: string) => {
    // In a real app, this would send a request to cancel the appointment
    const updatedAppointments = appointments.map((appointment) =>
      appointment.id === id
        ? { ...appointment, status: 'cancelled' as const }
        : appointment
    );
    
    setAppointments(updatedAppointments);
    
    // Update filtered lists
    setUpcomingAppointments(
      updatedAppointments.filter((appointment) => appointment.status === 'upcoming')
    );
    
    setPastAppointments(
      updatedAppointments.filter((appointment) => appointment.status !== 'upcoming')
    );
    
    toast('Appointment cancelled successfully', 'success');
  };
  
  if (!user) {
    return (
      <MainLayout>
        <section className="pt-32 pb-20 bg-primary-50">
          <div className="container text-center">
            <h1 className="mb-4">My Appointments</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Please log in to view your appointments.
            </p>
          </div>
        </section>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">My Appointments</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View and manage your upcoming and past appointments at Glamora Studio.
          </p>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          {/* Upcoming Appointments */}
          <h2 className="mb-8">Upcoming Appointments</h2>
          
          {upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancelAppointment}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-soft text-center mb-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Upcoming Appointments</h3>
              <p className="text-gray-600 mb-6">
                You don't have any upcoming appointments scheduled at this time.
              </p>
              <a
                href="/book"
                className="btn btn-primary"
              >
                Book an Appointment
              </a>
            </div>
          )}
          
          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <>
              <h2 className="mb-8 mt-16">Past Appointments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}