import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Services from '../pages/Services';
import Products from '../pages/Products';
import Book from '../pages/Book';
import MyAppointments from '../pages/MyAppointments';
import Contact from '../pages/Contact';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ResetPassword from '../pages/auth/ResetPassword';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import { useAuth } from '../context/AuthContext';

// Protected Route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/products" element={<Products />} />
      <Route path="/book" element={<Book />} />
      <Route 
        path="/my-appointments" 
        element={
          <ProtectedRoute>
            <MyAppointments />
          </ProtectedRoute>
        } 
      />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      
      {/* Catch all undefined routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}