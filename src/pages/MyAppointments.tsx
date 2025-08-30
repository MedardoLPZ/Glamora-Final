import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { AppointmentCard } from '../components/AppointmentCard';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../types';
import { toast } from '../components/ui/Toaster';
import { Calendar } from 'lucide-react';
import { onAuthChange, getToken } from '../lib/authStore';

// ahora desde el API layer
import { getAppointments, cancelAppointmentApi } from '../api/bookings.api';

export default function MyAppointments() {
  const { user, authFetch } = useAuth();
  const [token, setToken] = useState<string | null>(getToken());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const off = onAuthChange(s => setToken(s.token));
    return () => { off(); };
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        setLoading(true);
        const list = await getAppointments(authFetch);
        setAppointments(list);
      } catch (e: any) {
        toast(e.message ?? 'No se pudieron cargar las citas', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token, authFetch]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
    const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const handleCancelAppointment = async (id: string) => {
    try {
      await cancelAppointmentApi(id, authFetch);
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
      toast('Cita cancelada correctamente', 'success');
    } catch (e: any) {
      toast(e.message ?? 'No se pudo cancelar la cita', 'error');
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <section className="pt-32 pb-20 bg-primary-50">
          <div className="container text-center">
            <h1 className="mb-4">Mis citas</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Inicia sesión para ver tus citas.
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
          <h1 className="mb-4">Mis citas</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Vea y administre sus citas próximas y pasadas en Glamora Studio.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="mb-8">Próximas citas</h2>

          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow-soft text-center mb-16">Cargando…</div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={
                    appointment.status === 'pending' || appointment.status === 'confirmed'
                      ? handleCancelAppointment
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-soft text-center mb-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium mb-2">No hay citas próximas</h3>
              <p className="text-gray-600 mb-6">No tiene ninguna cita próxima programada en este momento.</p>
              <a href="/book" className="btn btn-primary">Reservar una cita</a>
            </div>
          )}

          <h2 className="mb-8 mt-16">Citas pasadas</h2>
          {pastAppointments.length > 0 && !loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            !loading && <p className="text-gray-600">No hay citas pasadas.</p>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
