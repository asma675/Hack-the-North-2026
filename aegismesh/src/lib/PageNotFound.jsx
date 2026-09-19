import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Radio } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PageNotFound() {
  const location = useLocation();
  const insideApp = location.pathname.startsWith('/app');
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 opacity-30 aegis-grid" />
      <div className="pointer-events-none absolute -top-48 -right-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl aegis-aurora" />
      <div className="absolute right-5 top-5"><ThemeToggle /></div>

      <section className="aegis-hard-panel aegis-corner-cut relative z-10 w-full max-w-xl border border-cyan-400/25 bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center border border-red-400/40 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,.12)]">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">AegisMesh</p>
              <p className="text-sm text-muted-foreground">Route integrity check failed</p>
            </div>
          </div>
          <Radio className="h-5 w-5 animate-pulse text-cyan-400" />
        </div>

        <div className="space-y-3">
          <div className="font-mono text-7xl font-black tracking-tighter text-foreground/15">404</div>
          <h1 className="text-3xl font-semibold tracking-tight">This control surface does not exist.</h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            No AegisMesh route is registered for <span className="font-mono text-foreground">{location.pathname}</span>. Your incident state and agent sessions are unchanged.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={insideApp ? '/app' : '/'} className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 hover:shadow-[0_0_24px_rgba(34,211,238,.12)]">
            <ArrowLeft className="h-4 w-4" />
            {insideApp ? 'Return to command center' : 'Return to AegisMesh'}
          </Link>
          {insideApp && (
            <Link to="/app/judge" className="inline-flex items-center border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-cyan-400/30">
              Open Judge Mode
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
