import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ServiceCard } from '../components/ServiceCard';
import { StylistCard } from '../components/StylistCard';
import { getAvailableServices, getServiceById } from '../data/services';
import { stylists, getStylistsBySpecialty } from '../data/stylists';
import { Service, Stylist, BookingFormData } from '../types';
import { generateTimeSlots, formatPrice, RESERVATION_FEE } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toaster';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { sendConfirmationEmail } from '../lib/email';

export default function Book() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
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
  const [availableStylists, setAvailableStylists] = useState<Stylist[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  // Check if a service was preselected via URL parameter
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
    
    // Load all available services
    setServices(getAvailableServices());
    
    // Generate time slots
    setAvailableTimeSlots(generateTimeSlots());
  }, [searchParams]);
  
  // When a service is selected, load relevant stylists
  useEffect(() => {
    if (selectedService) {
      // Find stylists who match the service's category
      const relevantStylists = getStylistsBySpecialty(selectedService.category);
      setAvailableStylists(relevantStylists.length > 0 ? relevantStylists : stylists);
    }
  }, [selectedService]);
  
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
  
  // Handle date and time selection
  const handleDateTimeChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
  };
  
  // Handle notes
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBookingData((prev) => ({ ...prev, notes: e.target.value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast('Please log in to complete your booking', 'info');
      navigate('/login?redirect=book');
      return;
    }
    
    try {
      // Send confirmation email
      await sendConfirmationEmail({
        customerName: user.name,
        serviceName: selectedService?.name || '',
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
      });
      
      // Navigate to confirmation page
      navigate('/checkout', { state: { bookingData, type: 'service' } });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      toast('Booking confirmed but failed to send email confirmation. Please check your appointment details in your account.', 'warning');
    }
  };
  
  // Navigation buttons
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Get the selected stylist
  const selectedStylist = bookingData.stylistId 
    ? availableStylists.find(s => s.id === bookingData.stylistId) 
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
          {/* Booking Steps */}
          <div className="mb-12">
            <div className="flex justify-between max-w-3xl mx-auto">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep >= 1 ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Select Service</span>
              </div>
              
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep >= 2 ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Choose Stylist</span>
              </div>
              
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep >= 3 ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                }`}>
                  3
                </div>
                <span className="text-sm font-medium">Select Date & Time</span>
              </div>
              
              <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep >= 4 ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                }`}>
                  4
                </div>
                <span className="text-sm font-medium">Confirm Booking</span>
              </div>
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
          
          {/* Step 2: Choose Stylist */}
          {currentStep === 2 && selectedService && (
            <div className="animate-fade-in">
              <h2 className="text-center mb-8">Choose Your Stylist</h2>
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
              
              <div className="flex justify-between mt-12">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Skip stylist selection (make it optional)
                    setCurrentStep(3);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Skip (No Preference)
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Select Date & Time */}
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
                <Button
                  variant="outline"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!bookingData.time}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Confirm Booking */}
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
                        Tu balance restante estimado de{formatPrice(selectedService.price - RESERVATION_FEE)} puede ser pagado una vez tu servicio se haya completado!
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
                    <span className="font-medium">{new Date(bookingData.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
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
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    fullWidth
                  >
                    Pay Reservation Fee & Confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    fullWidth
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