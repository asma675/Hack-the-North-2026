import { useAegis } from '@/lib/useAegis';
import { Panel, StatusBadge } from '@/components/aegis';
import { ShieldCheck, Check, X, Lock, Key, Fingerprint, FileText, AlertOctagon } from 'lucide-react';

export default function AegisGate() {
  const { actionRequests, capabilities, auditEvents } = useAegis();

  const recent = actionRequests.slice(-6).reverse();
  const blocked = actionRequests.filter(a => a.status === 'BLOCKED');
  const approved = actionRequests.filter(a => a.status === 'APPROVED' || a.status === 'EXECUTED');

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center aegis-glow-cyan">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">AEGIS GATE</h1>
          <p className="text-sm text-muted-foreground">Powered by Cloudflare — The execution airlock between autonomous agents and production</p>
        </div>
      </div>

      <div className="aegis-panel rounded-lg p-4">
        <div className="text-sm text-muted-foreground italic">
          <Lock className="w-4 h-4 inline mr-2 text-primary" />
          AI intelligence does not equal authority. Every action request passes through identity, capability, evidence, policy, and risk checks before reaching production.
        </div>
      </div>

      {/* Pipeline visualization */}
      <Panel title="Authorization Pipeline" subtitle="Every request passes through 8 checks">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {['IDENTITY', 'EVIDENCE', 'VERIFICATION', 'PERMISSIONS', 'RISK', 'POLICY', 'HUMAN APPROVAL', 'SIGNED CAPABILITY'].map((step, i) => (
            <div key={step} className="flex items-center shrink-0">
              <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border text-[10px] aegis-mono text-center min-w-[100px]">
                <div className="text-primary font-bold">{i + 1}</div>
                <div className="text-muted-foreground mt-0.5">{step}</div>
              </div>
              {i < 7 && <div className="w-4 h-px bg-border mx-0.5" />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incoming requests */}
        <Panel title="Incoming Action Requests" subtitle={`${actionRequests.length} total`}>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No action requests yet.</div>
            ) : (
              recent.map(ar => <RequestCard key={ar.id} ar={ar} />)
            )}
          </div>
        </Panel>

        {/* Execution capabilities */}
        <Panel title="Execution Capabilities" subtitle="Signed, short-lived, one-time-use">
          <div className="space-y-3">
            {capabilities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Key className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                No capabilities issued yet.
              </div>
            ) : (
              capabilities.map(cap => <CapabilityCard key={cap.id} cap={cap} />)
            )}
          </div>
        </Panel>
      </div>

      {/* Blocked actions detail */}
      {blocked.length > 0 && (
        <Panel title="Blocked Actions" subtitle={`${blocked.length} unsafe actions denied`} className="border-red-500/30">
          <div className="space-y-3">
            {blocked.map(ar => (
              <div key={ar.id} className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <span className="font-display font-bold text-red-400">BLOCKED</span>
                    <span className="aegis-mono text-xs text-muted-foreground">{ar.id}</span>
                  </div>
                  <StatusBadge status={ar.risk} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <CheckRow label="Identity" ok={true} />
                  <CheckRow label="Capability" ok={false} reason="Agent lacks hardware.execute" />
                  <CheckRow label="Incident State" ok={true} />
                  <CheckRow label="Evidence Confidence" ok={false} reason={`${Math.round(ar.verifier_confidence * 100)}% — below threshold`} />
                  <CheckRow label="Policy" ok={false} reason="Power control requires dual-control" />
                  <CheckRow label="Risk" ok={false} reason={ar.risk} />
                </div>
                <div className="mt-3 p-2 rounded bg-red-500/10 text-xs text-red-300">
                  <span className="font-medium">Reason:</span> {ar.reason}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Audit trail */}
      <Panel title="Audit Trail" subtitle="Every blocked request creates an audit event">
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {auditEvents.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No audit events.</div>
          ) : (
            auditEvents.slice(-15).reverse().map(ae => (
              <div key={ae.id} className="flex items-center gap-3 text-xs p-2 rounded bg-muted/20 border border-border">
                <span className="aegis-mono text-[10px] text-muted-foreground shrink-0 w-20">{new Date(ae.timestamp).toLocaleTimeString('en-US', { hour12: false }).slice(0, 8)}</span>
                <StatusBadge status={ae.decision} />
                <span className="aegis-mono text-[10px] text-primary">{ae.event}</span>
                <span className="text-muted-foreground truncate flex-1">{ae.reason}</span>
                <span className="aegis-mono text-[10px] text-muted-foreground">{ae.actor_id}</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function RequestCard({ ar }) {
  const checks = [
    { label: 'Identity', ok: true },
    { label: 'Capability', ok: ar.status !== 'BLOCKED' },
    { label: 'Incident State', ok: true },
    { label: 'Evidence Confidence', ok: ar.status !== 'BLOCKED', value: `${Math.round(ar.verifier_confidence * 100)}%` },
    { label: 'Policy', ok: ar.status !== 'BLOCKED' },
    { label: 'Risk', ok: ar.risk !== 'CRITICAL', value: ar.risk },
  ];
  const humanRequired = ar.human_required && ar.status !== 'BLOCKED';
  return (
    <div className={`p-4 rounded-lg border ${ar.status === 'BLOCKED' ? 'bg-red-500/5 border-red-500/30' : ar.status === 'APPROVAL_REQUIRED' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/20 border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="aegis-mono text-xs text-muted-foreground">{ar.id}</div>
          <div className="font-display font-bold text-sm mt-0.5">{ar.action}</div>
        </div>
        <StatusBadge status={ar.status} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
        <div className="text-muted-foreground">Agent: <span className="text-foreground aegis-mono">{ar.agent_id}</span></div>
        <div className="text-muted-foreground">Target: <span className="text-foreground aegis-mono">{ar.target}</span></div>
        <div className="text-muted-foreground">Blast: <span className="text-foreground aegis-mono">{ar.blast_radius}</span></div>
        <div className="text-muted-foreground">Reversible: <span className="text-foreground aegis-mono">{ar.reversible ? 'YES' : 'NO'}</span></div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1 text-[10px]">
            {c.ok ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-red-400" />}
            <span className="text-muted-foreground">{c.label}</span>
            {c.value && <span className="aegis-mono text-muted-foreground">{c.value}</span>}
          </div>
        ))}
      </div>
      {humanRequired && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
          <Fingerprint className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300">Human Approval REQUIRED</span>
        </div>
      )}
    </div>
  );
}

function CheckRow({ label, ok, reason }) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
      {ok ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
      <div>
        <div className="text-xs">{label}</div>
        {!ok && reason && <div className="text-[10px] text-red-400">{reason}</div>}
      </div>
    </div>
  );
}

function CapabilityCard({ cap }) {
  return (
    <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/30 aegis-glow-cyan">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm">AEGIS EXECUTION CAPABILITY</span>
        </div>
        <StatusBadge status={cap.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs aegis-mono">
        <div><span className="text-muted-foreground">Action ID:</span> <span className="text-foreground">{cap.action_request_id}</span></div>
        <div><span className="text-muted-foreground">Capability:</span> <span className="text-foreground">{cap.id}</span></div>
        <div><span className="text-muted-foreground">Incident:</span> <span className="text-foreground">{cap.incident_id}</span></div>
        <div><span className="text-muted-foreground">Target:</span> <span className="text-foreground">{cap.target}</span></div>
        <div><span className="text-muted-foreground">Command:</span> <span className="text-primary">{cap.command}</span></div>
        <div><span className="text-muted-foreground">Nonce:</span> <span className="text-foreground">{cap.nonce}</span></div>
        <div><span className="text-muted-foreground">Issued:</span> <span className="text-foreground">{cap.issued_at}</span></div>
        <div><span className="text-muted-foreground">Expires:</span> <span className="text-foreground">{cap.expires_at}</span></div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <FileText className="w-3.5 h-3.5 text-green-400" />
        <span className="text-green-400">Signature: VERIFIED</span>
        <span className="text-muted-foreground ml-2">One-Time Use: {cap.used ? 'CONSUMED' : 'YES'}</span>
      </div>
    </div>
  );
}