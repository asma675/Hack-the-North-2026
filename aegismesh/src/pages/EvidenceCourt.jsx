import { useAegis } from '@/lib/useAegis';
import { Panel, HypothesisBar, StatusBadge } from '@/components/aegis';
import { Scale, AlertCircle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

export default function EvidenceCourt() {
  const { incidents } = useAegis();
  const incident = incidents.find(i => i.verdict) || incidents.find(i => i.state !== 'CONTAINED') || incidents[0];

  if (!incident || !incident.verdict) {
    return (
      <div className="p-6">
        <div className="aegis-panel rounded-lg p-12 text-center max-w-2xl mx-auto">
          <Scale className="w-12 h-12 mx-auto text-primary mb-4 aegis-glow-cyan" />
          <h1 className="text-2xl font-display font-bold">OpenAI Evidence Court</h1>
          <p className="text-sm text-muted-foreground mt-2">No verdict has been issued yet.</p>
          <p className="text-xs text-muted-foreground mt-4">Start a breach scenario from Judge Mode to see the Evidence Court evaluate competing hypotheses.</p>
        </div>
      </div>
    );
  }

  const v = incident.verdict;
  const supporting = [
    { claim: '14 failed SSH logins then successful login', source: 'auth.log', confidence: 0.94, agent: 'security-02' },
    { claim: 'New outbound to 45.137.x.x:8443 (no DNS, no baseline)', source: 'network.flow', confidence: 0.93, agent: 'network-01' },
    { claim: 'Unknown process /tmp/.kworker-helper spawned post-login', source: 'process.list', confidence: 0.87, agent: 'telemetry-03' },
    { claim: 'No approved changes explain activity', source: 'change.log', confidence: 0.92, agent: 'change-01' },
    { claim: 'Login used password auth from unexpected external IP', source: 'auth.log', confidence: 0.94, agent: 'security-02' },
  ];
  const contradictory = [
    { claim: 'Nightly backup scheduled at this time', source: 'change.schedule', confidence: 0.88, agent: 'change-01' },
    { claim: 'CPU pattern partially matches backup windows', source: 'telemetry.history', confidence: 0.62, agent: 'telemetry-03' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center aegis-glow-cyan">
          <Scale className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">OpenAI Evidence Court</h1>
          <p className="text-sm text-muted-foreground">What does the evidence actually support, and what is the safest response?</p>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="aegis-panel rounded-lg p-6 aegis-glow-cyan">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] aegis-mono text-muted-foreground uppercase tracking-wider">Recommended Response</div>
          <StatusBadge status="APPROVED" />
        </div>
        <div className="text-3xl font-display font-bold aegis-text-cyan">{v.recommended}</div>
        <div className="flex items-center gap-4 mt-4">
          <div>
            <div className="text-[10px] aegis-mono text-muted-foreground">CONFIDENCE</div>
            <div className="text-2xl font-bold aegis-text-cyan">{Math.round(v.confidence * 100)}%</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] aegis-mono text-muted-foreground">REASON</div>
            <div className="text-sm text-foreground mt-1">{v.reason}</div>
          </div>
        </div>
      </div>

      {/* Three columns: hypotheses, supporting, contradictory */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Competing Hypotheses" subtitle="Ranked by evidence support">
          <div className="space-y-3">
            {v.hypotheses.map((h, i) => (
              <HypothesisBar key={i} title={h.title} confidence={h.confidence} leading={i === 0} />
            ))}
          </div>
        </Panel>

        <Panel title="Supporting Evidence" subtitle="Corroborating the leading hypothesis">
          <div className="space-y-2">
            {supporting.map((e, i) => (
              <div key={i} className="p-2.5 rounded bg-green-500/5 border border-green-500/20">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">{e.claim}</div>
                    <div className="text-[10px] text-muted-foreground aegis-mono mt-1">{e.source} · {e.agent} · {Math.round(e.confidence * 100)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Contradictory Evidence" subtitle="What challenges the conclusion">
          <div className="space-y-2">
            {contradictory.map((e, i) => (
              <div key={i} className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">{e.claim}</div>
                    <div className="text-[10px] text-muted-foreground aegis-mono mt-1">{e.source} · {e.agent} · {Math.round(e.confidence * 100)}%</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-2.5 rounded bg-muted/20 border border-border">
              <div className="text-[10px] text-muted-foreground aegis-mono">SKEPTIC CHALLENGE RESOLVED</div>
              <div className="text-xs mt-1">Backup hypothesis rejected: does not explain auth anomalies or new outbound traffic.</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Counterfactual analysis */}
      <Panel title="Counterfactual Action Analysis" subtitle="What happens if we are wrong?">
        <div className="grid md:grid-cols-3 gap-3">
          {v.counterfactuals.map((c, i) => {
            const isRecommended = c.option === v.recommended;
            return (
              <div key={i} className={`p-4 rounded-lg border ${isRecommended ? 'bg-primary/5 border-primary/40 aegis-glow-cyan' : 'bg-muted/20 border-border'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-display font-bold">{c.option}</div>
                  {isRecommended && <StatusBadge status="APPROVED" />}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Containment</span>
                    <span className={c.containment === 'HIGH' ? 'text-green-400' : c.containment === 'LOW' ? 'text-red-400' : 'text-amber-400'}>{c.containment}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Evidence Preservation</span>
                    <span className={c.forensics === 'HIGH' ? 'text-green-400' : c.forensics === 'LOW' ? 'text-red-400' : 'text-amber-400'}>{c.forensics}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service Impact</span>
                    <span className={c.impact.includes('CRITICAL') ? 'text-red-400' : c.impact.includes('MEDIUM') ? 'text-amber-400' : c.impact.includes('LOW') ? 'text-green-400' : 'text-red-400'}>{c.impact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* What would change this verdict */}
      <Panel title="What Would Change This Verdict?" subtitle="Intellectual honesty — missing evidence that would reduce confidence">
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 rounded bg-amber-500/5 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Confidence would decrease if:</div>
              <ul className="mt-1.5 space-y-1 text-muted-foreground text-xs">
                <li>• Outbound destination 45.137.x.x is confirmed as an approved backup target</li>
                <li>• Login is traced to expected automation with documented key rotation</li>
                <li>• Process /tmp/.kworker-helper appears in an approved deployment manifest</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded bg-green-500/5 border border-green-500/20">
            <Lightbulb className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Confidence would increase if:</div>
              <ul className="mt-1.5 space-y-1 text-muted-foreground text-xs">
                <li>• Outbound traffic payload matches known exfiltration signatures</li>
                <li>• Compromised credential is found in recent breach databases</li>
                <li>• Process binary matches known malware hash in threat intel</li>
              </ul>
            </div>
          </div>
        </div>
      </Panel>

      {/* Remediation plan */}
      <Panel title="Safe Remediation Plan" subtitle="Structured response — OpenAI proposes, does not execute">
        <div className="space-y-2">
          {[
            'Isolate outbound traffic from affected host',
            'Preserve current memory/process state',
            'Capture relevant logs',
            'Revoke compromised session',
            'Escalate credential rotation',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded bg-muted/20 border border-border">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs aegis-mono flex items-center justify-center font-bold">{i + 1}</span>
              <span className="text-sm">{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded bg-red-500/5 border border-red-500/20 text-xs text-muted-foreground">
          <span className="text-red-400 font-medium">Note:</span> OpenAI reasons and proposes. No production action is executed by the Evidence Court. All actions pass through Aegis Gate.
        </div>
      </Panel>
    </div>
  );
}