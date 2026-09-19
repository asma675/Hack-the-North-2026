import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAegis } from '@/lib/useAegis';
import { AgentMascot } from '@/components/AgentMascot';
import { Panel, StatusBadge, TrustScore } from '@/components/aegis';
import PermissionsPanel from '@/components/agent/PermissionsPanel';
import TrustHistoryPanel from '@/components/agent/TrustHistoryPanel';
import IncidentsPanel from '@/components/agent/IncidentsPanel';
import AuditTrailPanel from '@/components/agent/AuditTrailPanel';
import { ArrowLeft, Wrench, Database, RefreshCw } from 'lucide-react';

export default function AgentPassport() {
  const { id } = useParams();
  const { agents } = useAegis();
  const agent = agents.find(a => a.id === id);
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setData({ loading: true });
    (async () => {
      try {
        const [records, evidence, actionRequests, auditEvents, incidents] = await Promise.all([
          base44.entities.GovernedAgent.filter({ agent_key: id }),
          base44.entities.Evidence.filter({ agent_id: id }),
          base44.entities.ActionRequest.filter({ agent_key: id }),
          base44.entities.AuditEvent.filter({ actor_id: id }),
          base44.entities.Incident.list('-created_date', 50),
        ]);
        if (cancelled) return;
        const record = records[0] || null;
        const incidentIds = new Set([
          ...evidence.map(e => e.incident_id),
          ...actionRequests.map(a => a.incident_id),
          agent?.current_incident_id,
        ].filter(Boolean));
        const participated = (incidents || []).filter(i => incidentIds.has(i.incident_id));
        setData({ loading: false, record, evidence, actionRequests, auditEvents, incidents: participated });
      } catch (e) {
        if (!cancelled) setData({ loading: false, error: e.message });
      }
    })();
    return () => { cancelled = true; };
  }, [id, agent?.current_incident_id]);

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Agent not found. <Link to="/app/agents" className="text-primary hover:underline">View fleet</Link></p>
        </div>
      </div>
    );
  }

  const record = data.record;
  const liveTrust = agent.trust_score ?? agent.trust;
  const violations = record?.violations ?? agent.violations ?? 0;
  const trustHistory = [
    ...(record?.trust_history || []),
    ...(agent.trust_history || []).map(h => ({ date: new Date(h.t).toISOString(), trust: h.trust, reason: null })),
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <Link to="/app/agents" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet
      </Link>

      {/* Profile header */}
      <div className="aegis-panel rounded-lg p-6">
        <div className="text-[10px] aegis-mono text-muted-foreground tracking-widest mb-4">AGENT PROFILE</div>
        <div className="flex items-start gap-6">
          <AgentMascot agent={agent} size={96} animate={false} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{agent.name}</h1>
              <StatusBadge status={agent.status} />
              {record && <StatusBadge status={record.status === 'QUARANTINED' ? 'QUARANTINED' : 'LIVE'} />}
            </div>
            <div className="aegis-mono text-xs text-muted-foreground mt-1">{id}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground">PROVIDER</div>
                <div className="mt-0.5">{agent.provider}</div>
              </div>
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground">ROLE</div>
                <div className="mt-0.5">{agent.role}</div>
              </div>
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground">TRUST SCORE</div>
                <div className="flex items-center gap-2 mt-1">
                  <TrustScore score={liveTrust} size="sm" />
                  <span className="text-sm">{liveTrust} / 100</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground">VIOLATIONS</div>
                <div className={`mt-0.5 text-sm ${violations > 0 ? 'text-red-400' : 'text-green-400'}`}>{violations}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PermissionsPanel agent={agent} />

      {data.loading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-8">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading agent history...
        </div>
      ) : (
        <>
          <TrustHistoryPanel history={trustHistory} />

          <div className="grid md:grid-cols-2 gap-6">
            <IncidentsPanel
              incidents={data.incidents}
              evidence={data.evidence}
              actionRequests={data.actionRequests}
            />

            <Panel title="Tools" subtitle={`${agent.tools.length} available`}>
              <div className="space-y-2">
                {agent.tools.map(t => (
                  <div key={t} className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border text-xs">
                    <Wrench className="w-3.5 h-3.5 text-primary" />
                    <span className="aegis-mono">{t}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <AuditTrailPanel auditEvents={data.auditEvents} />

          <div className="flex items-center gap-2 text-[10px] aegis-mono text-muted-foreground">
            <Database className="w-3 h-3" />
            {data.error
              ? `LIVE ENGINE ONLY — history unavailable (${data.error})`
              : 'History served from the AegisMesh incident database'}
          </div>
        </>
      )}
    </div>
  );
}