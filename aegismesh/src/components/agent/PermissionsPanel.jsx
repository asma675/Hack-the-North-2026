import { Panel } from '@/components/aegis';

export default function PermissionsPanel({ agent }) {
  return (
    <Panel title="Permissions" subtitle="Full permission list — least privilege, enforced server-side by the Aegis Gate">
      <div className="space-y-3">
        <div>
          <div className="text-[10px] aegis-mono text-green-400 mb-2">PERMITTED ({agent.permissions.length})</div>
          <div className="flex flex-wrap gap-2">
            {agent.permissions.map(p => (
              <span key={p} className="text-xs aegis-mono px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">✓ {p}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] aegis-mono text-red-400 mb-2 mt-4">DENIED ({agent.denied.length})</div>
          <div className="flex flex-wrap gap-2">
            {agent.denied.map(p => (
              <span key={p} className="text-xs aegis-mono px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">✕ {p}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}