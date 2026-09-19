import { Panel } from '@/components/aegis';
import IncidentRow from './IncidentRow';

export default function IncidentsPanel({ incidents, evidence, actionRequests }) {
  return (
    <Panel title="Incidents Participated In" subtitle="All-time participation, from the incident record">
      {incidents.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No incident history recorded to date.</div>
      ) : (
        <div className="space-y-2">
          {incidents.map(incident => (
            <IncidentRow
              key={incident.incident_id}
              incident={incident}
              evidenceCount={evidence.filter(e => e.incident_id === incident.incident_id).length}
              actionRequests={actionRequests.filter(a => a.incident_id === incident.incident_id)}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}