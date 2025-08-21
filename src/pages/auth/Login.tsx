import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { Lock, Mail } from 'lucide-react';
import { toast } from '../../components/ui/Toaster';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Check if there's a redirect URL in the query params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast('Login successful!', 'success');
      navigate(redirectTo);
    } catch (error) {
      if (error instanceof Error) {
        toast(error.message, 'error');
      } else {
        toast('Failed to login. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout hideNav>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-white">
        <div className="bg-white rounded-lg shadow-soft-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Link to="/">
                <Logo size="lg" />
              </Link>
            </div>
            <h1 className="text-3xl font-semibold mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                fullWidth
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              />
              
              <Input
                label="Password"
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                fullWidth
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              />
              
              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-primary-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}