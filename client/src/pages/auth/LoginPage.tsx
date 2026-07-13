import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Fuel, ArrowRight, CheckCircle, Zap, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Role = 'client' | 'admin';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('client');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) return <Navigate to={user.role === 'CLIENT' ? '/app/client' : '/app'} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password, role === 'client' ? 'CLIENT' : 'ADMIN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#f8fafc]">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[500px] w-[500px] rounded-full bg-fire-500/5 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-navy-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-full w-full opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(30,58,95,0.08) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left branding panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex lg:w-1/2 xl:w-[45%] lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0d1424_0%,#0A0F1C_60%,#2a1205_100%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-fire-500/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/4 rounded-full bg-navy-500/10 blur-[90px]" />

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fire-gradient shadow-lg shadow-fire-500/20">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-base font-extrabold leading-none">ON FIRE</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Fuel Provider</div>
              </div>
            </Link>
          </div>

          <div className="relative z-10 my-8">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-fire-500/20 bg-fire-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-fire-300">
              <Zap className="h-3 w-3" /> Industrial Fuel Distribution
            </span>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Fuel Your <span className="text-fire-gradient">Operations</span><br />Without Interruption
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              The end-to-end platform for mining, energy, and construction companies to manage fuel orders, track deliveries, and reconcile invoices.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {['Real-time delivery tracking', 'Automated digital invoicing', 'Stock monitoring & alerts'].map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs italic leading-relaxed text-slate-300">
              "On Fire transformed how we manage fuel supply. Orders that took days now take minutes, and we never miss a delivery."
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-navy-800 text-[10px] font-bold text-slate-400">MN</div>
              <div>
                <div className="text-xs font-semibold text-white">M. Ndiaye</div>
                <div className="text-[10px] text-slate-500">Supply Manager, SNIM Mining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md animate-fade-in lg:max-w-lg">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fire-gradient shadow-lg shadow-fire-500/20">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-navy-900">On Fire</h1>
              <p className="text-sm text-slate-500">Fuel Delivery Platform</p>
            </div>

            {/* Role selector */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <div className="flex gap-1">
                {(['client', 'admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
                      role === r
                        ? 'bg-white text-fire-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r === 'client' ? 'Client Portal' : 'Admin / Operations'}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-navy-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              {role === 'client' ? 'Access your orders, deliveries, and invoices.' : 'Manage orders, clients, stock, and payments.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'client' ? 'client@company.com' : 'admin@bajservices.com'}
                autoComplete="email"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-fire-500 focus:ring-fire-500" />
                  Remember me
                </label>
                <button type="button" className="text-sm font-semibold text-fire-600 hover:text-fire-700">
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                className="mt-2 w-full gap-2 bg-fire-gradient hover:brightness-110"
                isLoading={submitting}
              >
                Sign in
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don’t have an account?{' '}
              <Link to="/" className="font-semibold text-fire-600 hover:text-fire-700">
                Contact your account manager
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

