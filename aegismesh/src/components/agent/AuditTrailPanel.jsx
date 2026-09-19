import { Panel, StatusBadge } from '@/components/aegis';

const DECISION_TONE = { DENY: 'text-red-400', APPROVE: 'text-green-400', REJECT: 'text-red-400', PENDING: 'text-amber-400', AUTO_APPROVED: 'text-green-400' };

export default function AuditTrailPanel({ auditEvents }) {
  const sorted = [...(auditEvents || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return (
    <Panel title="Audit Trail" subtitle="Server-recorded decisions involving this agent">
      {sorted.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No audit events recorded.</div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sorted.map(e => (
            <div key={e.id} className="flex items-start gap-3 p-2 rounded bg-muted/20 border border-border text-xs">
              <span className="aegis-mono text-[10px] text-muted-foreground shrink-0 w-36">
                {new Date(e.created_date).toLocaleString('en-US', { hour12: false })}
              </span>
              <span className="aegis-mono text-[10px] text-primary shrink-0">{e.event}</span>
              <span className="flex-1 text-muted-foreground">{e.reason}</span>
              {e.decision && (
                <span className={`aegis-mono text-[10px] shrink-0 ${DECISION_TONE[e.decision] || 'text-muted-foreground'}`}>{e.decision}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}