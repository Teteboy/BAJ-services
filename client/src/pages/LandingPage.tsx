import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, ArrowRight, Truck, BarChart3, ShieldCheck, Zap, FileText, Users,
  CheckCircle, ChevronRight, Phone, Mail, Globe, Droplets, Plane,
} from 'lucide-react';

const features = [
  { icon: Zap, title: 'Instant Order Placement', desc: 'Submit fuel orders in under a minute and receive real-time confirmation.' },
  { icon: Truck, title: 'Delivery Tracking', desc: 'Track every load from validation through dispatch to on-site delivery.' },
  { icon: FileText, title: 'Automated Invoicing', desc: 'Invoices and receipts are generated automatically upon delivery confirmation.' },
  { icon: BarChart3, title: 'Weekly Reports', desc: 'Get scheduled reports on sales, deliveries, stock, and outstanding payments.' },
  { icon: Users, title: 'Multi-Client Management', desc: 'Dedicated portals with custom pricing, locations, and payment terms.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Admins manage operations while clients see only their own data.' },
];

const products = [
  { title: 'Gasoil', tag: 'Most Ordered', desc: 'High-quality diesel for generators, heavy machinery, and mining fleets. Min. order 10,000 L.', icon: Droplets, color: 'blue' },
  { title: 'Fuel Oil', tag: 'High Volume', desc: 'Heavy fuel oil for power plants, boilers, and marine use. Delivered in bulk tankers.', icon: Droplets, color: 'purple', featured: true },
  { title: 'Jet A1', tag: 'Aviation', desc: 'ASTM D1655 certified aviation kerosene for mining airstrips and regional operators.', icon: Plane, color: 'amber' },
];

const steps = [
  { number: '1', title: 'Submit Your Order', desc: 'Choose product, volume, delivery site, and preferred date in your client portal.' },
  { number: '2', title: 'We Validate & Schedule', desc: 'Our operations team confirms availability and assigns a driver and vehicle.' },
  { number: '3', title: 'Delivered & Invoiced', desc: 'Fuel is delivered on schedule and your invoice appears instantly in the portal.' },
];

const stats = [
  { id: 'c1', value: 120, suffix: '+', label: 'Industrial Clients' },
  { id: 'c2', value: 2400000000, suffix: ' L', label: 'Litres Delivered' },
  { id: 'c3', value: 98, suffix: '%', label: 'On-Time Rate' },
  { id: 'c4', value: 15, suffix: '+', label: 'Years Operating' },
];

function animateCounters() {
  const animate = (id: string, target: number, suffix: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 1800;
    const step = target / (duration / 16);
    const run = () => {
      start += step;
      if (start >= target) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      el.textContent = Math.floor(start).toLocaleString() + suffix;
      requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  };
  stats.forEach((s) => animate(s.id, s.value, s.suffix));
}

export default function LandingPage() {
  useEffect(() => {
    const section = document.getElementById('stats');
    if (!section) return;
    let animated = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          animated = true;
          animateCounters();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-700">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fire-gradient shadow-lg shadow-fire-500/20">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-extrabold leading-none text-navy-900">ON FIRE</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Fuel Provider</div>
            </div>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {['Products', 'How It Works', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-slate-500 transition-colors hover:text-navy-900">
                {item}
              </a>
            ))}
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-fire-gradient px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fire-500/25 transition-all hover:brightness-110">
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#f8fafc_0%,#eef6ff_40%,#fff7ed_100%)] px-6 py-24 lg:py-32">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 h-[600px] w-[600px] rounded-full bg-fire-500/5 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-[500px] w-[500px] rounded-full bg-navy-500/5 blur-3xl" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(30,58,95,0.07) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <svg className="absolute right-0 top-1/2 h-[80%] w-auto -translate-y-1/2 translate-x-1/4 opacity-[0.07] text-navy-900" viewBox="0 0 200 200" fill="currentColor">
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="60" />
            <circle cx="100" cy="100" r="40" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-fire-200 bg-orange-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fire-600">
              <Zap className="h-3 w-3" /> Industrial Fuel Distribution
            </span>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-navy-900 sm:text-6xl">
              Fuel Your <span className="text-fire-gradient">Operations</span><br />Without Interruption
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Reliable bulk delivery of Gasoil, Fuel Oil, and Jet A1 to mining, energy, and construction sites — fully tracked, invoiced, and compliant.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-fire-gradient px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-fire-500/30 transition-all hover:brightness-110">
                Place Your First Order <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-lg border border-fire-300 px-7 py-3.5 text-base font-semibold text-fire-600 transition-all hover:bg-orange-50">
                See How It Works <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-12 flex items-center gap-4 border-t border-slate-200 pt-8">
              <div className="flex">
                {['SN', 'KN', 'SM'].map((initials, i) => (
                  <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600" style={{ marginLeft: i > 0 ? '-8px' : 0 }}>
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Trusted by <span className="font-semibold text-navy-900">120+ industrial clients</span>
              </p>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <Truck className="h-5 w-5 text-fire-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900">Active Delivery</p>
                    <p className="text-xs text-slate-500">DEL-OFF-2024-091</p>
                  </div>
                </div>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  In Transit
                </span>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-slate-500">
                  <span>Dispatch Center</span>
                  <span className="font-semibold text-fire-600">64% en route</span>
                  <span>SNIM — Zouerate</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[64%] rounded-full bg-fire-gradient shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Product', value: 'Gasoil' },
                  { label: 'Volume', value: '150,000 L' },
                  { label: 'Driver', value: 'M. Diallo' },
                  { label: 'ETA', value: '14:00 Today', color: 'text-emerald-600' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                    <p className={`mt-1 text-sm font-bold text-navy-900 ${item.color ?? ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="text-center" style={{ borderRight: i < 3 ? '1px solid #e2e8f0' : undefined }}>
                <p className="text-4xl font-black text-fire-gradient">
                  <span id={s.id}>0</span>{s.suffix}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-fire-200 bg-orange-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fire-600">
              Our Products
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-900">
              The Right Fuel for Every Operation
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Certified petroleum products delivered in bulk with full compliance documentation and quality reports.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {products.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`relative rounded-2xl border bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg ${p.featured ? 'border-fire-300 shadow-orange-100' : 'border-slate-200'}`}>
                  {p.featured && <span className="absolute right-4 top-4 rounded bg-fire-gradient px-2 py-1 text-[10px] font-bold text-white">{p.tag}</span>}
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${p.color === 'blue' ? 'bg-blue-50 text-blue-600' : p.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-navy-900">{p.title}</h3>
                    {!p.featured && p.tag && <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{p.tag}</span>}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500">{p.desc}</p>
                  <ul className="space-y-2">
                    {productBullets(p.title).map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative overflow-hidden py-24 bg-slate-50">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(30,58,95,0.06) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-fire-200 bg-orange-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fire-600">
              Simple Process
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-900">
              From Order to Delivery in 3 Steps
            </h2>
          </div>
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={i} className="relative grid grid-cols-[60px_1fr] gap-6 pb-10">
                {i < steps.length - 1 && (
                  <div className="absolute left-[28px] top-14 h-[calc(100%-40px)] w-px bg-gradient-to-b from-fire-300 to-transparent" />
                )}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-fire-200 bg-orange-50 text-lg font-black text-fire-600">
                  {s.number}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-fire-200 bg-orange-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fire-600">
              Why On Fire
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-900">
              Built for Industrial Scale
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              Everything you need to manage your fuel supply chain — from ordering to payment — in one platform.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group relative rounded-xl border border-slate-100 bg-slate-50 p-6 transition-all hover:-translate-y-1 hover:border-fire-200 hover:bg-white hover:shadow-md">
                  <div className="absolute left-0 right-0 top-0 h-0.5 bg-fire-gradient opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-fire-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-2 text-base font-bold text-navy-900">{f.title}</h4>
                  <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLIENTS ── */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Trusted by leading industrial operators
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['SNIM Mining', 'SOMELEC Power', 'KINROSS Mining', 'SAM Construction', 'MCM Industries', 'TASIAST Gold Mine', '+ 114 more'].map((c) => (
              <span key={c} className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-navy-900">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-24 bg-[linear-gradient(135deg,#1E3A5F_0%,#0f172a_50%,#1a0a00_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire-500/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-fire-500/25 bg-fire-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fire-300">
            Get Started Today
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Ready to Keep Your <span className="text-fire-gradient">Operations Running?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Join 120+ industrial companies who rely on On Fire for reliable, traceable, and compliant fuel delivery.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-fire-gradient px-8 py-4 text-base font-bold text-white shadow-lg shadow-fire-500/30 transition-all hover:brightness-110">
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:contact@onfire.com" className="inline-flex items-center gap-2 rounded-lg border border-fire-400/40 px-8 py-4 text-base font-semibold text-fire-400 transition-all hover:bg-fire-500/10">
              Talk to Sales
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">No commitment required · Setup in 24 hours · Dedicated onboarding support</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fire-gradient">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-extrabold text-navy-900">ON FIRE FUEL PROVIDER</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                Industrial petroleum distribution for mining, energy, and construction sectors. Reliable supply. Zero compromise.
              </p>
            </div>
            <div>
              <h5 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Products</h5>
              <div className="flex flex-col gap-2">
                {['Gasoil', 'Fuel Oil (HFO)', 'Jet A1', 'Request Custom Grade'].map((l) => (
                  <span key={l} className="cursor-pointer text-sm text-slate-500 transition-colors hover:text-navy-900">{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h5 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Platform</h5>
              <div className="flex flex-col gap-2">
                {['Client Portal', 'Order Tracking', 'Invoicing & Payments', 'Stock Reports'].map((l) => (
                  <span key={l} className="cursor-pointer text-sm text-slate-500 transition-colors hover:text-navy-900">{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h5 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Company</h5>
              <div className="flex flex-col gap-2">
                {['About Us', 'Careers', 'Contact', 'Legal & Compliance'].map((l) => (
                  <span key={l} className="cursor-pointer text-sm text-slate-500 transition-colors hover:text-navy-900">{l}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 md:flex-row">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} On Fire Fuel Provider. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +222 00 00 00 00</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> contact@onfire.com</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> onfire.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function productBullets(title: string) {
  switch (title) {
    case 'Gasoil':
      return ['Min. order: 10,000 L', 'EN 590 certified', '48h delivery lead time'];
    case 'Fuel Oil':
      return ['Min. order: 100,000 L', 'ISO 8217 compliant', 'Viscosity-controlled transport'];
    default:
      return ['Min. order: 25,000 L', 'ASTM D1655 certified', 'Full lab quality report'];
  }
}
