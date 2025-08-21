import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { toast } from '../components/ui/Toaster';
import { CreditCard, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowConfirmation(true);
      clearCart();
    } catch (error) {
      toast('Payment failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (showConfirmation) {
    return (
      <MainLayout>
        <div className="pt-32 pb-32 min-h-screen flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-soft max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Thank You for Your Order!</h2>
            <p className="text-gray-600 mb-8">
              Your order has been successfully placed. A confirmation email has been sent to your inbox.
            </p>
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Order Reference</p>
              <p className="text-gray-800 text-lg">#ORDER-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
            </div>
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Checkout</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete your purchase by providing your details below.
          </p>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-soft p-6">
                <form onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-6">Billing Address</h2>
                  <div className="grid grid-cols-1 gap-4 mb-8">
                    <Input
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="State/Province"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="ZIP/Postal Code"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <CreditCard className="w-6 h-6 text-primary-500 mr-2" />
                      <span>Credit Card</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Card Number"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiration Date (MM/YY)"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="CVC"
                          name="cardCvc"
                          placeholder="123"
                          value={formData.cardCvc}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    Complete Order
                  </Button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-soft sticky top-24">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold">Order Summary</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-500 text-sm ml-1">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>{formatPrice(totalPrice * 0.1)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary-600">{formatPrice(totalPrice * 1.1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}