// src/pages/Book.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/ServiceCard';
import { StylistCard } from '../components/StylistCard';
import type { Service, Stylist, BookingFormData } from '../types';
import { generateTimeSlots, formatPrice, RESERVATION_FEE } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toaster';
import { ArrowLeft, ArrowRight, Info, Loader2 } from 'lucide-react';
import { sendConfirmationEmail } from '../lib/email';

// APIs existentes
import { makeStylistsApi } from '../api/stylist.api';
import { makeServicesApi } from '../api/services.api';

// NUEVO: API de bookings usando la misma fórmula que users
import { createBooking, mapUIToCreateBooking } from '../api/bookings.api';

// Config (ajusta si no usarás impuestos todavía)
const TAX_RATE = 0.15; // pon 0 si no calcularás ISV de momento

export default function Book() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authFetch } = useAuth();

  // API clients
  const stylistsApi = useMemo(() => makeStylistsApi(authFetch), [authFetch]);
  const servicesApi = useMemo(() => makeServicesApi(authFetch), [authFetch]);

  // Booking steps
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    serviceId: '',
    stylistId: '', // guardamos aquí una sola estilista (o vacío = sin preferencia)
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: '',
  });

  // ===== Servicios (desde backend) =====
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesErr, setServicesErr] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // ===== Estilistas (desde backend, selección ÚNICA) =====
  const [dbStylists, setDbStylists] = useState<Stylist[]>([]);
  const [availableStylists, setAvailableStylists] = useState<Stylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(true);
  const [stylistsError, setStylistsError] = useState<string | null>(null);

  // Estado de envío para bloquear botones en Confirm
  const [submitting, setSubmitting] = useState(false);

  // ---------- Cargar Servicios (y preselección por ?service=ID) ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingServices(true);
      setServicesErr(null);
      try {
        const { data } = await servicesApi.listServicesUI({ include_inactive: true, all: true });
        const active = data.filter((s: Service) => (s as any).active);
        if (!mounted) return;
        setServices(active);

        const serviceId = searchParams.get('service');
        if (serviceId) {
          const found = active.find((s: Service) => String((s as any).id) === String(serviceId));
          if (found) {
            setSelectedService(found);
            setBookingData(prev => ({ ...prev, serviceId: String((found as any).id) }));
            setCurrentStep(2);
          }
        }
      } catch (e: any) {
        if (!mounted) return;
        setServicesErr(e?.message || 'No se pudieron cargar los servicios.');
      } finally {
        if (mounted) setLoadingServices(false);
      }
    })();

    setAvailableTimeSlots(generateTimeSlots());
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesApi]);

  // ---------- Cargar Estilistas Públicos (activos) ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingStylists(true);
      setStylistsError(null);
      try {
        const { data } = await stylistsApi.listPublicStylistsUI({ all: true });
        const mapped: Stylist[] = data.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          specialty: s.specialty || '',
          avatar: s.image ?? s.img ?? '',
          bio: s.bio || '',
        }));
        if (!mounted) return;
        setDbStylists(mapped);
        setAvailableStylists(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setStylistsError(e?.message || 'No se pudieron cargar las estilistas.');
      } finally {
        if (mounted) setLoadingStylists(false);
      }
    })();
    return () => { mounted = false; };
  }, [stylistsApi]);

  // ---------- Filtro de estilistas por servicio seleccionado ----------
  useEffect(() => {
    if (!selectedService) {
      setAvailableStylists(dbStylists);
      return;
    }
    const cat = (String((selectedService as any).category || '')).trim().toLowerCase();
    const filtered = dbStylists.filter(s => {
      const spec = (String(s.specialty || '')).trim().toLowerCase();
      if (!cat) return true;
      return spec.includes(cat);
    });
    setAvailableStylists(filtered.length ? filtered : dbStylists);
  }, [selectedService, dbStylists]);

  // ---------- Handlers ----------
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setBookingData(prev => ({ ...prev, serviceId: String((service as any).id) }));
    setCurrentStep(2);
  };

  // Selección ÚNICA de estilista: al click, guardamos el id y pasamos a Step 3
  const handleStylistSelect = (stylist: Stylist) => {
    setSelectedStylistId(String(stylist.id));
    setBookingData(prev => ({ ...prev, stylistId: String(stylist.id) }));
    setCurrentStep(3);
  };

  const handleDateTimeChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBookingData(prev => ({ ...prev, notes: e.target.value }));
  };

  // Navegación
  const handleNext = () => setCurrentStep(s => Math.min(4, s + 1));
  const handleBack = () => setCurrentStep(s => Math.max(1, s - 1));

  const selectedStylist = selectedStylistId
    ? availableStylists.find(s => String(s.id) === String(selectedStylistId))
    : null;

  // Totales para el resumen (usa TAX_RATE y RESERVATION_FEE)
  const price = selectedService?.price ?? 0;
  const totals = useMemo(() => {
    const subtotal = +(Number(price) || 0).toFixed(2);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    const remaining = Math.max(total - RESERVATION_FEE, 0);
    return { subtotal, tax, total, remaining };
  }, [price]);

  // Submit: crear Booking en backend y bloquear doble clic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // evita doble click
    setSubmitting(true);

    try {
      if (!user) {
        toast('Please log in to complete your booking', 'info');
        navigate('/login?redirect=book');
        return;
      }
      if (!selectedService) {
        toast('Select a service first', 'warning');
        setCurrentStep(1);
        return;
      }
      if (!bookingData.date || !bookingData.time) {
        toast('Select date & time', 'warning');
        setCurrentStep(3);
        return;
      }

      const dto = mapUIToCreateBooking({
        userId: user.id,
        stylistId: bookingData.stylistId || '',
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
        service: {
          id: (selectedService as any).id,
          price: selectedService.price,
        },
        taxRate: TAX_RATE,
        status: 0,          // STATUS_PENDING
        includeItems: true, // enviamos el servicio como item
      });

      const created = await createBooking(dto, { fetcher: authFetch });

      // Email opcional después de crear
      try {
        await sendConfirmationEmail({
          customerName: user.name,
          serviceName: selectedService.name || '',
          appointmentDate: bookingData.date,
          appointmentTime: bookingData.time,
        });
      } catch (mailErr) {
        console.warn('Failed to send confirmation email:', mailErr);
      }

      toast('Your appointment has been booked ✔', 'success');
      if ((created as any)?.id) {
        navigate(`/account/bookings/${(created as any).id}`);
      } else {
        navigate('/account/bookings');
      }
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      toast(error?.message ?? 'Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Book an Appointment</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Schedule your next appointment with our team of professional stylists.
            Select a service, choose your preferred stylist, and find a time that works for you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Steps */}
          <div className="mb-12">
            <div className="flex justify-between max-w-3xl mx-auto">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`flex flex-col items-center ${currentStep >= n ? 'text-primary-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      currentStep >= n ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                    }`}
                  >
                    {n}
                  </div>
                  <span className="text-sm font-medium">
                    {n === 1
                      ? 'Select Service'
                      : n === 2
                      ? 'Choose Stylist'
                      : n === 3
                      ? 'Select Date & Time'
                      : 'Confirm Booking'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-center mb-8">Select a Service</h2>

              {loadingServices && (
                <div className="text-center text-gray-500 py-8">Loading services…</div>
              )}
              {servicesErr && <div className="text-center text-red-600 py-8">{servicesErr}</div>}

              {!loadingServices && !servicesErr && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((service) => (
                    <div
                      key={(service as any).id}
                      onClick={() => handleServiceSelect(service)}
                      className="cursor-pointer transition-transform hover:-translate-y-1"
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose ONE Stylist */}
          {currentStep === 2 && selectedService && (
            <div className="animate-fade-in">
              <h2 className="text-center mb-8">Choose Your Stylist</h2>

              {stylistsError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {stylistsError}
                </div>
              )}

              {loadingStylists ? (
                <div className="text-center text-gray-500 py-8">Loading stylists…</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {availableStylists.map((stylist) => (
                    <StylistCard
                      key={stylist.id}
                      stylist={stylist}
                      isSelected={selectedStylistId === String(stylist.id)}
                      onClick={() => handleStylistSelect(stylist)}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-12">
                <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Permitir “No preference”
                    setSelectedStylistId('');
                    setBookingData(prev => ({ ...prev, stylistId: '' }));
                    setCurrentStep(3);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Skip (No Preference)
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <h2 className="text-center mb-8">Select Date & Time</h2>

              <div className="bg-white p-8 rounded-lg shadow-soft">
                <div className="mb-6">
                  <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.date}
                    onChange={(e) => handleDateTimeChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`py-2 px-4 text-sm border rounded-md transition-colors ${
                          bookingData.time === time
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleDateTimeChange('time', time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-700">
                    Special Requests or Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    className="input"
                    placeholder="Any specific requests for your appointment..."
                    value={bookingData.notes || ''}
                    onChange={handleNotesChange}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!bookingData.time} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 4 && selectedService && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <h2 className="text-center mb-8">Confirm Your Booking</h2>

              <div className="bg-white p-8 rounded-lg shadow-soft">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary-800 mb-1">Reservation Fee Required</h4>
                      <p className="text-sm text-primary-700">
                        Una reservation fee de {formatPrice(RESERVATION_FEE)} se requiere para completar tu reservación.
                        Tu balance restante estimado de {formatPrice(totals.remaining)} puede ser pagado una vez tu servicio se haya completado!
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-medium mb-6">Booking Summary</h3>

                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>

                  {selectedStylist && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Stylist:</span>
                      <span className="font-medium">{selectedStylist.name}</span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(bookingData.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{bookingData.time}</span>
                  </div>

                  {bookingData.notes && (
                    <div className="mt-4">
                      <span className="text-gray-600 block mb-1">Notes:</span>
                      <p className="text-sm bg-gray-50 p-3 rounded">{bookingData.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formatPrice(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-medium">
                    <span>Total:</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-medium text-primary-600">
                    <span>Reservation Fee (Due Now):</span>
                    <span>{formatPrice(RESERVATION_FEE)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">Remaining Balance:</span>
                    <span>{formatPrice(totals.remaining)}</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    fullWidth
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    fullWidth
                    disabled={submitting} // ← también bloqueado para evitar inconsistencias
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
