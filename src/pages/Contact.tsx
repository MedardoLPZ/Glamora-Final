// src/pages/Contact.tsx
import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toaster';
import { Mail, Phone, MapPin, Clock, Send, User } from 'lucide-react';

type Errors = Partial<Record<'name'|'email'|'phone'|'message', string>>;

// Usa la MISMA variable que tu AuthContext
// En .env: VITE_API_URL=http://localhost/glamora-bk/public/api
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/glamora-bk/public/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    company: '' // honeypot (DEBE quedar vacío)
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    if (!name) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email is invalid';
    if (!message) errs.message = 'Message is required';
    else if (message.length < 10) errs.message = 'Please write at least 10 characters';
    if (phone && phone.length < 7) errs.phone = 'Phone seems too short';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Importante: tu API_BASE ya termina en /api → solo /contact
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Honeypot se envía vacío si es humano
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          message: formData.message.trim(),
          company: formData.company,
        }),
      });

      if (!res.ok) {
        // Manejo de 422 y otros errores con fallback a texto
        let msg = 'Failed to send message. Please try again.';
        try {
          const data = await res.json();
          if (data?.errors) {
            const laravelErrors: Errors = {};
            Object.entries(data.errors).forEach(([k, v]) => {
              laravelErrors[k as keyof Errors] = Array.isArray(v) ? v[0] : String(v);
            });
            setErrors(laravelErrors);
          }
          if (data?.message) msg = data.message;
        } catch {
          const txt = await res.text().catch(() => '');
          if (txt) msg = txt.slice(0, 200);
        }
        throw new Error(msg);
      }

      toast('¡Mensaje enviado! Te contactaremos pronto.', 'success');
      setFormData({ name: '', email: '', phone: '', message: '', company: '' });
      setErrors({});
    } catch (err: any) {
      toast(err?.message ?? 'Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have a question or want to book an appointment? Reach out to us and our team will get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-lg shadow-soft">
              <h2 className="mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot anti-spam (oculto) */}
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="hidden"
                  autoComplete="off"
                  tabIndex={-1}
                />

                <Input
                  label="Your Name"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  error={errors.name}
                  leftIcon={<User className="w-5 h-5 text-gray-400" />}
                />
                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={errors.email}
                  leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
                />
                <div className="mb-4">
                  <label
                    htmlFor="message"
                    className="block mb-1.5 text-sm font-medium text-gray-700"
                  >
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className={`px-4 py-2.5 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 w-full ${
                      errors.message ? 'border-red-400' : 'border-gray-200'
                    }`}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="mb-6">Contact Information</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Our Location</h3>
                    <p className="text-gray-600">
                      Res. Costas del Sol, <br />
                      15 calle 21103 San Pedro Sula, Cortés
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Phone Number</h3>
                    <p className="text-gray-600">
                      <a href="tel:+50495248210" className="hover:text-primary-600 transition-colors">
                        (504) 9524-8210
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Email Address</h3>
                    <p className="text-gray-600">
                      <a href="mailto:info@glamorastudiohn.com" className="hover:text-primary-600 transition-colors">
                        info@glamorastudiohn.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Business Hours</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li className="flex justify-between">
                        <span>Monday - Friday: </span>
                        <span>9:00 AM - 7:00 PM</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Saturday:</span>
                        <span>9:00 AM - 6:00 PM</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Sunday:</span>
                        <span>10:00 AM - 4:00 PM</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-16">
        <div className="container">
          <div className="bg-gray-200 h-96 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps?q=15.4892816,-87.9944183&z=18&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Glamora Studio Location"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
