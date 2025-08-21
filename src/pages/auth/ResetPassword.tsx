import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { Mail } from 'lucide-react';
import { toast } from '../../components/ui/Toaster';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };
  
  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setIsSuccess(true);
      toast('Password reset instructions sent to your email', 'success');
    } catch (error) {
      if (error instanceof Error) {
        toast(error.message, 'error');
      } else {
        toast('Failed to send reset instructions. Please try again.', 'error');
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
            <h1 className="text-3xl font-semibold mb-2">Reset Password</h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>
          
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-medium mb-4">Check Your Email</h3>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="primary" fullWidth>
                    Return to Login
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsSuccess(false)}
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                value={email}
                onChange={handleChange}
                error={error}
                fullWidth
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                isLoading={isLoading}
              >
                Send Reset Instructions
              </Button>
              
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
          
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