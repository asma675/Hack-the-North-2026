import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/aegis';

export default function IncidentRow({ incident, evidenceCount, actionRequests }) {
  return (
    <Link to={`/app/incidents/${incident.incident_id}`} className="block p-3 rounded bg-muted/20 border border-border hover:border-primary/30 transition">
      <div className="flex items-center justify-between gap-2">
        <span className="aegis-mono text-xs text-primary">{incident.incident_id}</span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={incident.severity} />
          <StatusBadge status={incident.state} />
        </div>
      </div>
      <div className="text-sm font-medium mt-1.5">{incident.title}</div>
      <div className="text-[10px] text-muted-foreground mt-1.5">
        {evidenceCount > 0 && `${evidenceCount} evidence item${evidenceCount > 1 ? 's' : ''} contributed`}
        {evidenceCount > 0 && actionRequests.length > 0 && ' · '}
        {actionRequests.length > 0 && `${actionRequests.length} action request${actionRequests.length > 1 ? 's' : ''}`}
      </div>
      {actionRequests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {actionRequests.map(ar => (
            <span key={ar.request_id} className="inline-flex items-center gap-1">
              <StatusBadge status={ar.status} />
              <span className="text-[10px] aegis-mono text-muted-foreground">{ar.action}</span>
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}