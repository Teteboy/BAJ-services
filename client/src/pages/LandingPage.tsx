import { Link } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  Truck,
  BarChart3,
  ShieldCheck,
  Zap,
  FileText,
  Users,
  CheckCircle,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

/* ─── reusable local components ─── */

function GlowBlob({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      style={{ backgroundColor: 'rgba(26,100,240,0.12)' }}
    />
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
      {children}
    </span>
  );
}

/* ─── section data ─── */

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Instant Order Placement',
    desc: 'Clients place fuel orders in under 60 seconds. Real-time confirmation, no phone calls needed.',
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: 'Delivery Tracking',
    desc: 'Full visibility on delivery status from validation to on-site arrival.',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Automated Invoicing',
    desc: 'Invoices generated automatically upon delivery. PDF download with one click.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Weekly Reports',
    desc: 'Auto-generated weekly summaries — sales, deliveries, stock levels, and outstanding payments.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Multi-Client Management',
    desc: 'Each client gets a dedicated portal with custom pricing, locations, and payment terms.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Role-Based Access',
    desc: 'Admins manage everything. Clients see only their own data — fully secure.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Request Access',
    desc: 'Contact us to set up your company account. We configure pricing, locations, and payment terms.',
  },
  {
    number: '02',
    title: 'Place Your Order',
    desc: 'Log in to your client portal and submit a fuel order with delivery date and quantity.',
  },
  {
    number: '03',
    title: 'We Validate & Deliver',
    desc: 'Our team validates your order, schedules the truck, and delivers to your location.',
  },
  {
    number: '04',
    title: 'Receive Invoice',
    desc: 'Invoice is automatically generated and sent. Pay via bank transfer or cheque.',
  },
];

const stats = [
  { value: '500+', label: 'Deliveries Made' },
  { value: '98%', label: 'On-Time Rate' },
  { value: '40+', label: 'Active Clients' },
  { value: '24h', label: 'Response Time' },
];

/* ─── main component ─── */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: '#0b0f1a', color: '#e8eaf0' }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'rgba(30,36,64,0.6)', backgroundColor: 'rgba(11,15,26,0.85)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-glow-sm">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">On Fire</span>
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 md:flex">
            {['Features', 'How It Works', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium transition-colors" style={{ color: '#9ea5be' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ea5be')}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow-sm transition-all duration-300 hover:shadow-glow hover:brightness-110"
          >
            Client Portal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
        <GlowBlob className="left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2" />
        <GlowBlob className="right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 bg-brand-500/8" />

        <div className="relative z-10 max-w-4xl animate-fade-in">
          <Tag>
            <Flame className="h-3 w-3" /> Fuel Delivery Platform
          </Tag>

          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tighter sm:text-6xl lg:text-7xl" style={{ color: '#ffffff' }}>
            Fuel delivery,{' '}
            <span className="text-gradient">on demand.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: '#9ea5be' }}>
            On Fire is the end-to-end fuel delivery management platform — orders, invoices,
            payments, and reports, all in one place. Built for businesses that can't afford downtime.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-7 py-3.5 text-base font-bold text-white shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:brightness-110"
            >
              Access Your Portal <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all duration-300" style={{ border: '1px solid #2c3252', backgroundColor: 'rgba(30,36,64,0.6)', color: '#c8ccd9' }}
            >
              See How It Works <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mt-24 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4" style={{ border: '1px solid rgba(44,50,82,0.7)', backgroundColor: 'rgba(30,36,64,0.3)' }}>
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-1 px-6 py-6 backdrop-blur-sm" style={{ backgroundColor: 'rgba(19,24,41,0.7)' }}
            >
              <span className="text-3xl font-black tracking-tight" style={{ color: '#fff' }}>{s.value}</span>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4e5880' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="relative px-6 py-28">
        <GlowBlob className="right-0 top-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/4" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Tag>Platform Features</Tag>
            <h2 className="mt-4 text-4xl font-black tracking-tighter lg:text-5xl" style={{ color: '#fff' }}>
              Everything your operations need
            </h2>
            <p className="mx-auto mt-4 max-w-xl" style={{ color: '#9ea5be' }}>
              One platform to manage your entire fuel supply chain — from order to payment.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-350 hover:shadow-card-hover" style={{ border: '1px solid rgba(44,50,82,0.7)', backgroundColor: '#131829' }}
              >
                {/* glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-350 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(circle at top left, rgba(49,133,252,0.07) 0%, transparent 60%)' }}
                />
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-bold" style={{ color: '#fff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9ea5be' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="relative px-6 py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <GlowBlob className="left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <Tag>How It Works</Tag>
            <h2 className="mt-4 text-4xl font-black tracking-tighter lg:text-5xl" style={{ color: '#fff' }}>
              Up and running in 4 steps
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-7 hidden h-px w-1/2 translate-x-full bg-gradient-to-r from-brand-600/40 to-transparent lg:block" />
                )}
                <div className="rounded-2xl p-6" style={{ border: '1px solid rgba(44,50,82,0.7)', backgroundColor: '#131829' }}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10">
                    <span className="text-xl font-black text-brand-400">{step.number}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold" style={{ color: '#fff' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#9ea5be' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY ON FIRE — PROOF STRIP
      ══════════════════════════════════════════ */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-2xl p-10 shadow-glow-lg" style={{ border: '1px solid rgba(26,100,240,0.2)', background: 'linear-gradient(135deg, rgba(17,31,82,0.6) 0%, #131829 50%, #131829 100%)' }}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tighter" style={{ color: '#fff' }}>
              Why businesses choose <span className="text-gradient">On Fire</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Dedicated client portal with real-time order tracking',
              'Automated invoice generation — no manual paperwork',
              'Custom pricing per client — negotiated rates honoured automatically',
              'Weekly performance reports delivered to your inbox',
              'Multiple delivery locations per client account',
              'Secure JWT-based authentication with role separation',
              'Admin dashboard with KPIs, trends & stock management',
              'Payment tracking with bank transfer & cheque support',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <p className="text-sm" style={{ color: '#c8ccd9' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <GlowBlob className="left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="flex justify-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-glow">
              <Flame className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter lg:text-5xl" style={{ color: '#fff' }}>
            Ready to ignite your <span className="text-gradient">operations?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg" style={{ color: '#9ea5be' }}>
            Contact us to get your company onboarded. Your team will be ordering fuel within the day.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:brightness-110"
            >
              Sign In to Portal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════ */}
      <section id="contact" className="relative px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Tag>Contact</Tag>
            <h2 className="mt-4 text-3xl font-black tracking-tighter" style={{ color: '#fff' }}>Get in touch</h2>
            <p className="mt-3" style={{ color: '#9ea5be' }}>
              Have questions? Our team responds within 24 hours.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: <Phone className="h-5 w-5" />, label: 'Phone', value: '+237 6XX XXX XXX' },
              { icon: <Mail className="h-5 w-5" />, label: 'Email', value: 'contact@onfire.cm' },
              { icon: <MapPin className="h-5 w-5" />, label: 'Location', value: 'Douala, Cameroon' },
            ].map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(44,50,82,0.7)', backgroundColor: '#131829' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                  {c.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4e5880' }}>{c.label}</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: '#fff' }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(30,36,64,0.8)' }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-500">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: '#fff' }}>On Fire</span>
          </div>
          <p className="text-xs" style={{ color: '#3d4566' }}>
            © {new Date().getFullYear()} On Fire — Fuel Delivery Platform. All rights reserved.
          </p>
          <Link
            to="/login"
            className="text-xs font-medium transition-colors" style={{ color: '#4e5880' }}
          >
            Client Portal →
          </Link>
        </div>
      </footer>
    </div>
  );
}
