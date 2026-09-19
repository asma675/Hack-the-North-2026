import { Panel } from '@/components/aegis';
import { Code, Check } from 'lucide-react';

const CONTRIBUTIONS = [
  { title: 'Generated Cloudflare contract tests', desc: 'Created test suites verifying execution capability signing, expiry, and one-time-use enforcement.' },
  { title: 'Built Raspberry Pi telemetry simulator', desc: 'Generated the synthetic log/metric emitter that produces realistic CPU, disk, and auth events for demo scenarios.' },
  { title: 'Found race condition in realtime incident state', desc: 'Identified a timing issue where state transitions could fire before agent.join events completed. Added sequencing guard.' },
  { title: 'Created poisoned-runbook regression test', desc: 'Built a test that plants malicious instructions and verifies Aegis Gate blocks the resulting unauthorized action.' },
  { title: 'Generated agent permission tests', desc: 'Created tests verifying each agent role can only request actions within its declared capability set.' },
  { title: 'Refactored event schemas', desc: 'Unified the realtime event payload structure across incident, agent, evidence, and action types.' },
  { title: 'Debugged hardware command validation', desc: 'Traced an edge rejection to a nonce mismatch in the capability signature verification path.' },
];

export default function Codex() {
  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Codex</h1>
        <p className="text-sm text-muted-foreground mt-1">Genuine ways OpenAI Codex contributed to AegisMesh development</p>
      </div>

      <div className="aegis-panel rounded-lg p-4 border-amber-500/20">
        <div className="text-xs text-muted-foreground">
          <span className="text-amber-400 font-medium">Note:</span> Only contributions that actually happened are listed here.
        </div>
      </div>

      <div className="space-y-3">
        {CONTRIBUTIONS.map((c, i) => (
          <div key={i} className="aegis-panel rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-sm">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.desc}</div>
              </div>
              <Check className="w-4 h-4 text-green-400 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}