import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { toast } from '../../components/ui/Toaster';

export default function NewPassword() {
  const { confirmResetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = qs.get('token') || '';
  const emailQS = qs.get('email') || '';

  const [email, setEmail] = useState(emailQS);
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string; passwordConf?: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    const emailNorm = email.trim().toLowerCase();
    if (!token) e.email = 'Invalid or missing token';
    if (!emailNorm) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(emailNorm)) e.email = 'Email is invalid';

    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';

    if (!passwordConf) e.passwordConf = 'Please confirm your password';
    else if (passwordConf !== password) e.passwordConf = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await confirmResetPassword(email.trim().toLowerCase(), token, password, passwordConf);
      toast('Password updated. You can now sign in.', 'success');
      navigate('/'); // 👈 Redirige a la raíz al recibir 200 (éxito)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reset password';
      toast(msg, 'error');
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
              <Link to="/"><Logo size="lg" /></Link>
            </div>
            <h1 className="text-3xl font-semibold mb-2">Set a New Password</h1>
            <p className="text-gray-600">
              Enter your email and choose a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              fullWidth
              disabled={!!emailQS || isLoading}
            />

            <Input
              label="New Password"
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              fullWidth
              disabled={isLoading}
            />

            <Input
              label="Confirm New Password"
              type="password"
              id="passwordConf"
              name="passwordConf"
              placeholder="••••••••"
              value={passwordConf}
              onChange={(e) => setPasswordConf(e.target.value)}
              error={errors.passwordConf}
              fullWidth
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
              Update Password
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
