import { useState } from 'react';
import { useAegis } from '@/lib/useAegis';
import { Panel, StatusBadge } from '@/components/aegis';
import { Shield, Fingerprint, Check, X, FileSearch, Clock } from 'lucide-react';

export default function Approvals() {
  const { actionRequests, approveAction, rejectAction } = useAegis();
  const [approving, setApproving] = useState(null);

  const pending = actionRequests.filter(a => a.status === 'APPROVAL_REQUIRED');

  const handleApprove = (id) => {
    setApproving(id);
    setTimeout(() => {
      approveAction(id);
      setApproving(null);
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Human Approval Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Dual-Control AI — neither AI nor human alone is sufficient for high-impact autonomous execution</p>
      </div>

      {/* Two-key rule */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="aegis-panel rounded-lg p-5">
          <div className="text-[10px] aegis-mono text-muted-foreground mb-2">KEY 1</div>
          <div className="font-display font-bold text-lg">AI Evidence Authorization</div>
          <div className="text-sm text-muted-foreground mt-1">OpenAI Evidence Court</div>
          <div className="flex items-center gap-2 mt-4">
            <div className="text-3xl font-bold aegis-text-cyan">94%</div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Check className="w-4 h-4" /> VERIFIED
            </div>
          </div>
        </div>
        <div className="aegis-panel rounded-lg p-5">
          <div className="text-[10px] aegis-mono text-muted-foreground mb-2">KEY 2</div>
          <div className="font-display font-bold text-lg">Human Authority</div>
          <div className="text-sm text-muted-foreground mt-1">Incident Commander NFC</div>
          <div className="flex items-center gap-2 mt-4">
            {pending.length > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <Clock className="w-4 h-4 animate-aegis-pulse" /> WAITING...
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check className="w-4 h-4" /> SATISFIED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      <Panel title="Pending High-Risk Actions" subtitle={`${pending.length} awaiting human authorization`}>
        {pending.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 mx-auto text-green-400 mb-3" />
            <div className="text-sm font-medium text-green-400">No pending approvals</div>
            <div className="text-xs text-muted-foreground mt-1">All high-risk actions have been reviewed.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(ar => (
              <div key={ar.id} className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={ar.risk} />
                      <span className="aegis-mono text-xs text-muted-foreground">{ar.id}</span>
                    </div>
                    <div className="font-display font-bold text-lg">{ar.action}</div>
                    <div className="text-sm text-muted-foreground mt-1">Target: <span className="aegis-mono">{ar.target}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] aegis-mono text-muted-foreground">OPENAI CONFIDENCE</div>
                    <div className="text-2xl font-bold aegis-text-cyan">{Math.round(ar.verifier_confidence * 100)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <div className="text-[10px] text-muted-foreground aegis-mono">AGENT</div>
                    <div className="mt-1 aegis-mono">{ar.agent_id}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <div className="text-[10px] text-muted-foreground aegis-mono">BLAST RADIUS</div>
                    <div className="mt-1">{ar.blast_radius}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <div className="text-[10px] text-muted-foreground aegis-mono">REVERSIBLE</div>
                    <div className="mt-1">{ar.reversible ? 'YES' : 'NO'}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <div className="text-[10px] text-muted-foreground aegis-mono">REQUIRED PERM</div>
                    <div className="mt-1 aegis-mono">{ar.required_permission}</div>
                  </div>
                </div>

                <div className="p-3 rounded bg-muted/20 border border-border mb-4 text-xs">
                  <div className="text-[10px] text-muted-foreground aegis-mono mb-1">EVIDENCE SUMMARY</div>
                  <div className="text-muted-foreground">
                    14 failed SSH logins followed by successful login. New outbound connection to unknown IP.
                    Unknown process spawned post-login. No approved changes explain activity. Skeptic challenge resolved.
                  </div>
                </div>

                {approving === ar.id ? (
                  <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <Fingerprint className="w-6 h-6 text-violet-400 animate-aegis-pulse" />
                    <div>
                      <div className="text-sm font-medium text-violet-300">TAP INCIDENT COMMANDER BADGE</div>
                      <div className="text-xs text-muted-foreground mt-0.5">NFC authorization in progress...</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded text-xs bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition">
                      <FileSearch className="w-3.5 h-3.5" /> Request More Evidence
                    </button>
                    <button onClick={() => rejectAction(ar.id)} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button onClick={() => handleApprove(ar.id)} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition ml-auto">
                      <Shield className="w-3.5 h-3.5" /> Approve via NFC
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}