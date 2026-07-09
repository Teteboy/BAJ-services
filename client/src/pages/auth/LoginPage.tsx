import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Fuel, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-200">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) return <Navigate to={user.role === 'CLIENT' ? '/app/client' : '/app'} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-200 px-4">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(49,133,252,0.07) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Glow blob */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/8 blur-[140px]" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-glow">
            <Fuel className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-surface-900">On Fire</h1>
            <p className="mt-1 text-sm text-surface-500">Fuel Delivery Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-300 bg-white p-8 shadow-card-hover">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-surface-900">Sign in</h2>
            <p className="mt-1 text-xs text-surface-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@onfire.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Button type="submit" className="mt-2 w-full gap-2" isLoading={submitting}>
              Sign in
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-surface-500">
          © {new Date().getFullYear()} On Fire · Fuel Delivery Platform
        </p>
      </div>
    </div>
  );
}
