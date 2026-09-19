import { Panel } from '@/components/aegis';
import { Server, Check } from 'lucide-react';

const TIERS = [
  {
    name: 'Team',
    price: ' Starter',
    desc: 'For teams beginning to monitor autonomous agents',
    features: ['Agent monitoring', 'Small fleet management', 'Incident history', 'Basic trust scoring', 'Community support'],
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: ' Growth',
    desc: 'For organizations deploying agents at scale',
    features: ['Agent Passports', 'Action Firewall', 'Custom policies', 'Human approvals (NFC)', 'Audit history', 'Enterprise integrations', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Critical Infrastructure',
    price: ' Regulated',
    desc: 'For banks, utilities, hospitals, government',
    features: ['Private deployment', 'Hardware enforcement', 'Advanced policy engine', 'Edge gateways', 'Custom compliance', 'Regulated environments', 'Dedicated support'],
    highlight: false,
  },
];

const METRICS = [
  { label: 'Protected Agents', desc: 'Per active agent under governance' },
  { label: 'Protected Assets', desc: 'Per production asset behind Aegis Gate' },
  { label: 'Controlled Actions', desc: 'Per governed action request' },
  { label: 'Enterprise Integrations', desc: 'Per connected system' },
  { label: 'Retention', desc: 'Audit and incident memory retention' },
  { label: 'Edge Gateways', desc: 'Per deployed enforcement device' },
];

export default function Platform() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">AegisMesh Platform</h1>
        <p className="text-sm text-muted-foreground mt-1">The trust infrastructure for the agentic enterprise</p>
      </div>

      {/* Value props */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Prevent Costly Mistakes', desc: 'Stop unsafe agent actions before production damage.' },
          { title: 'Reduce Response Labor', desc: 'AI specialists investigate in parallel instead of large human bridge calls.' },
          { title: 'Reduce Time to Containment', desc: 'Accelerate detection → investigation → verification → containment.' },
          { title: 'Unlock Governed Automation', desc: 'Controlled transition from read → reason → propose → governed action.' },
        ].map((v, i) => (
          <div key={i} className="aegis-panel rounded-lg p-4">
            <div className="font-display font-bold text-sm">{v.title}</div>
            <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{v.desc}</div>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map(t => (
          <div key={t.name} className={`aegis-panel rounded-lg p-6 ${t.highlight ? 'border-primary/40 aegis-glow-cyan' : ''}`}>
            {t.highlight && <div className="text-[10px] aegis-mono text-primary mb-2">RECOMMENDED</div>}
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <div className="font-display font-bold text-lg">{t.name}</div>
            </div>
            <div className="text-sm text-primary mt-1">{t.price}</div>
            <div className="text-xs text-muted-foreground mt-2">{t.desc}</div>
            <div className="mt-4 space-y-2">
              {t.features.map(f => (
                <div key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Billing metrics */}
      <Panel title="Usage-Based Metrics" subtitle="Future billing dimensions">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {METRICS.map(m => (
            <div key={m.label} className="p-3 rounded bg-muted/20 border border-border">
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Market positioning */}
      <div className="aegis-panel rounded-lg p-8 text-center">
        <h2 className="text-xl font-display font-bold">AI intelligence is becoming abundant.</h2>
        <h2 className="text-xl font-display font-bold mt-1 aegis-text-cyan">Production authority remains scarce.</h2>
        <p className="text-sm text-muted-foreground mt-4 max-w-lg mx-auto">
          AegisMesh allows enterprises to safely give AI agents more responsibility without giving those agents unlimited power.
        </p>
      </div>
    </div>
  );
}