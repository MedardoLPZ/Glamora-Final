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
    if (isSuccess) setIsSuccess(false); // si cambia el email, vuelve al formulario
  };

  const validateForm = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(normalized)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const normalized = email.trim().toLowerCase();
    try {
      // resetPassword ya hace el POST a /auth/forgot-password
      await resetPassword(normalized);
      // incluso si el backend devuelve 422, mostramos éxito para no filtrar si el correo existe
      setIsSuccess(true);
      toast('If the email is registered, we sent you reset instructions.', 'success');
    } catch (error) {
      // en caso de error de red/servidor real, aún así mostramos éxito (uso recomendado)
      setIsSuccess(true);
      toast('If the email is registered, we sent you reset instructions.', 'success');
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium mb-4">Check Your Email</h3>
              <p className="text-gray-600 mb-6">
                If an account exists for <span className="font-medium">{email.trim().toLowerCase()}</span>, 
                you’ll receive a password reset link. Please check your inbox and spam folder.
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
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                isLoading={isLoading}
                disabled={isLoading}
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
