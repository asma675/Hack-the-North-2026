import { Panel } from '@/components/aegis';
import { Shield, Lock, FileSearch, FileCheck, UserCheck, Bug, Cpu, FileText } from 'lucide-react';

const PRINCIPLES = [
  { icon: Shield, title: 'Zero-Trust Agent Identity', desc: 'Every agent has a passport with verified identity, provider, and trust score. No anonymous actions.' },
  { icon: Lock, title: 'Least Privilege', desc: 'Agents receive only the permissions needed for their role. No universal write access. No agent has unrestricted production access.' },
  { icon: FileSearch, title: 'Evidence Provenance', desc: 'Every claim is traced to its source, agent, and timestamp. Evidence reliability is scored and auditable.' },
  { icon: FileCheck, title: 'Action Firewall', desc: 'Every production request is inspected against identity, capability, policy, risk, and blast radius before execution.' },
  { icon: UserCheck, title: 'Human-in-the-Loop', desc: 'High-impact actions require dual-control: AI evidence authorization plus human NFC authority.' },
  { icon: Bug, title: 'Prompt Injection Resistance', desc: 'Poisoned instructions are detected when agents request actions outside their capabilities. Agents are quarantined, not trusted.' },
  { icon: Cpu, title: 'Hardware Enforcement', desc: 'Execution capabilities are signed, short-lived, target-specific, and one-time-use. The edge rejects expired, reused, or unsigned commands.' },
  { icon: FileText, title: 'Auditability', desc: 'Every blocked request, approval, and execution creates an immutable audit event. Full incident replay is always available.' },
];

export default function TrustCenter() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Trust Center</h1>
        <p className="text-sm text-muted-foreground mt-1">The security principles that make autonomous AI safe for production</p>
      </div>

      {/* Hero statement */}
      <div className="aegis-panel rounded-lg p-8 text-center aegis-glow-cyan">
        <h2 className="text-3xl font-display font-bold tracking-tight">AI recommends. <span className="aegis-text-cyan">Aegis authorizes.</span></h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
          AI intelligence is becoming abundant. Production authority remains scarce. AegisMesh is the trust infrastructure that bridges them.
        </p>
      </div>

      {/* Zero unrestricted access */}
      <div className="aegis-panel rounded-lg p-6 border-green-500/30 aegis-glow-green">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Agents with unrestricted production access</div>
            <div className="text-5xl font-bold aegis-text-green mt-2">0</div>
          </div>
          <Shield className="w-16 h-16 text-green-400/30" />
        </div>
      </div>

      {/* Principles grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {PRINCIPLES.map((p, i) => (
          <div key={i} className="aegis-panel rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{p.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dual control */}
      <Panel title="Dual-Control AI" subtitle="Neither AI nor human alone is sufficient">
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto aegis-glow-cyan">
              <span className="text-xs aegis-mono text-cyan-400">AI</span>
            </div>
            <div className="text-xs mt-2 text-muted-foreground">Key 1</div>
            <div className="text-[10px] aegis-mono text-muted-foreground">Evidence</div>
          </div>
          <div className="text-2xl text-muted-foreground">+</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto aegis-glow-amber">
              <span className="text-xs aegis-mono text-violet-400">HUMAN</span>
            </div>
            <div className="text-xs mt-2 text-muted-foreground">Key 2</div>
            <div className="text-[10px] aegis-mono text-muted-foreground">Authority</div>
          </div>
          <div className="text-2xl text-muted-foreground">=</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto aegis-glow-green">
              <span className="text-xs aegis-mono text-green-400">EXEC</span>
            </div>
            <div className="text-xs mt-2 text-muted-foreground">Signed</div>
            <div className="text-[10px] aegis-mono text-muted-foreground">Capability</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}