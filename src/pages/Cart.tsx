import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return;
    updateQuantity(id, quantity);
  };
  
  const handleCheckout = () => {
    setIsCheckingOut(true);
    // In a real app, this would navigate to a checkout page
    setTimeout(() => {
      navigate('/checkout');
    }, 1000);
  };
  
  if (items.length === 0) {
    return (
      <MainLayout>
        <section className="pt-32 pb-20 bg-primary-50">
          <div className="container text-center">
            <h1 className="mb-4">Your Cart</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your cart is currently empty.
            </p>
          </div>
        </section>
        
        <section className="section">
          <div className="container text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-8">
              Looks like you haven't added any products or services to your cart yet.
              Explore our services and products to find something you'll love.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button size="lg">Browse Services</Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg">Shop Products</Button>
              </Link>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Your Cart</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Review and modify your selected items before checkout.
          </p>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-medium">Cart Items ({items.length})</h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4">
                      {item.image && (
                        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-md">
                              <button 
                                className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-2 py-1 min-w-[40px] text-center">
                                {item.quantity}
                              </span>
                              <button 
                                className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button 
                              className="text-gray-400 hover:text-error-500 transition-colors"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.price)}</p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-500">
                                {formatPrice(item.price)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-gray-100 flex justify-between">
                  <button
                    className="text-gray-500 hover:text-error-500 flex items-center gap-2 transition-colors"
                    onClick={clearCart}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Cart</span>
                  </button>
                  
                  <Link to="/" className="text-primary-600 hover:text-primary-700 transition-colors">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-soft overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-medium">Order Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(totalPrice * 0.1)}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary-600">{formatPrice(totalPrice * 1.1)}</span>
                    </div>
                  </div>
                  
                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    onClick={handleCheckout}
                    isLoading={isCheckingOut}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}