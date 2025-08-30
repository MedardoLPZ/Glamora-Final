import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/ServiceCard';
import { StylistCard } from '../components/StylistCard';
import { getAvailableServices, getServiceById } from '../data/services';
import { Service, Stylist, BookingFormData } from '../types';
import { generateTimeSlots, formatPrice, RESERVATION_FEE } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toaster';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { sendConfirmationEmail } from '../lib/email';

// 👇 NUEVO: API de estilistas
import { makeStylistsApi, type UIStylist } from '../api/stylist.api';

export default function Book() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authFetch } = useAuth();

  // API client (usa tu authFetch, aunque el público no requiere token)
  const stylistsApi = useMemo(() => makeStylistsApi(authFetch), [authFetch]);

  // Booking steps
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    serviceId: '',
    stylistId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: '',
  });

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // 👇 Estilistas desde backend + lista visible según filtros
  const [dbStylists, setDbStylists] = useState<Stylist[]>([]);
  const [availableStylists, setAvailableStylists] = useState<Stylist[]>([]);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(true);
  const [stylistsError, setStylistsError] = useState<string | null>(null);

  // Cargar servicios locales y preselección por URL
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      const service = getServiceById(serviceId);
      if (service && !service.isComingSoon) {
        setBookingData((prev) => ({ ...prev, serviceId }));
        setSelectedService(service);
        setCurrentStep(2);
      }
    }
    setServices(getAvailableServices());
    setAvailableTimeSlots(generateTimeSlots());
  }, [searchParams]);

  // 👉 Cargar estilistas públicos (solo activos) desde backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingStylists(true);
      setStylistsError(null);
      try {
        // Dentro del useEffect que llama stylistsApi.listPublicStylistsUI({ all: true })
        const { data } = await stylistsApi.listPublicStylistsUI({ all: true });

        // UIStylist tiene .image; garantizamos que tu tipo Stylist tenga .avatar
        const mapped: Stylist[] = data.map((s) => {
          const src = s.image ?? (s as any).img ?? ""; // por si algún backend usa "img"
          return {
            id: s.id,
            name: s.name,
            specialty: s.specialty || "",
            avatar: src,     // 👈 lo que lee tu StylistCard
            bio: s.bio || "",          // 👈 ahora sí mandamos la bio al card
          } as Stylist;
        });

        setDbStylists(mapped);
        setAvailableStylists(mapped);

      } catch (e: any) {
        setStylistsError(e?.message || 'No se pudieron cargar las estilistas.');
      } finally {
        setLoadingStylists(false);
      }
    })();
    return () => { mounted = false; };
  }, [stylistsApi]);

  // Filtro de estilistas según servicio seleccionado
  useEffect(() => {
    if (!selectedService) {
      setAvailableStylists(dbStylists);
      return;
    }
    const cat = (selectedService.category || '').toString().trim().toLowerCase();

    // Match flexible: si la especialidad contiene la categoría (id o texto)
    const filtered = dbStylists.filter((s) => {
      const spec = (s.specialty || '').toString().trim().toLowerCase();
      if (!cat) return true;
      return spec.includes(cat); // ajusta si quieres equivalencias más estrictas
    });

    setAvailableStylists(filtered.length ? filtered : dbStylists);
  }, [selectedService, dbStylists]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setBookingData((prev) => ({ ...prev, serviceId: service.id }));
    setCurrentStep(2);
  };

  // Handle stylist selection
  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData((prev) => ({ ...prev, stylistId: stylist.id }));
    setCurrentStep(3);
  };

  // Handle date/time/notes
  const handleDateTimeChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBookingData((prev) => ({ ...prev, notes: e.target.value }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please log in to complete your booking', 'info');
      navigate('/login?redirect=book');
      return;
    }
    try {
      await sendConfirmationEmail({
        customerName: user.name,
        serviceName: selectedService?.name || '',
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
      });
      navigate('/checkout', { state: { bookingData, type: 'service' } });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      toast(
        'Booking confirmed but failed to send email confirmation. Please check your appointment details in your account.',
        'warning'
      );
    }
  };

  // Nav buttons
  const handleNext = () => setCurrentStep((s) => Math.min(4, s + 1));
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const selectedStylist = bookingData.stylistId
    ? availableStylists.find((s) => s.id === bookingData.stylistId)
    : null;

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
              {[1,2,3,4].map((n) => (
                <div key={n} className={`flex flex-col items-center ${currentStep >= n ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= n ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                  }`}>{n}</div>
                  <span className="text-sm font-medium">
                    {n===1?'Select Service':n===2?'Choose Stylist':n===3?'Select Date & Time':'Confirm Booking'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-center mb-8">Select a Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                  >
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Stylist (desde backend) */}
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
                      isSelected={bookingData.stylistId === stylist.id}
                      onClick={() => handleStylistSelect(stylist)}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-12">
                <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
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
                    onChange={(e) => setBookingData((p) => ({ ...p, notes: e.target.value }))}
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
                        Una reservation fee de {formatPrice(RESERVATION_FEE)} VIA Transferencia se requiere para completar tu reservacion. 
                        Tu balance restante estimado de {formatPrice(selectedService.price - RESERVATION_FEE)} puede ser pagado una vez tu servicio se haya completado!
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
                  {bookingData.stylistId && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Stylist:</span>
                      <span className="font-medium">
                        {availableStylists.find((s) => s.id === bookingData.stylistId)?.name}
                      </span>
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
                    <span className="text-gray-600">Total Service Price:</span>
                    <span>{formatPrice(selectedService.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-medium text-primary-600">
                    <span>Reservation Fee (Due Now):</span>
                    <span>{formatPrice(RESERVATION_FEE)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600">Remaining Balance:</span>
                    <span>{formatPrice(selectedService.price - RESERVATION_FEE)}</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                  <Button onClick={handleSubmit} size="lg" fullWidth>
                    Pay Reservation Fee & Confirm
                  </Button>
                  <Button variant="outline" onClick={handleBack} fullWidth>
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
