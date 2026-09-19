import { Panel } from '@/components/aegis';
import TrustHistoryChart from './TrustHistoryChart';

function fmtDate(d) {
  try { return new Date(d).toLocaleString('en-US', { hour12: false }); } catch (e) { return String(d); }
}

export default function TrustHistoryPanel({ history }) {
  return (
    <Panel title="Trust Score History" subtitle="Every recorded trust change for this agent">
      {history.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No trust changes recorded.</div>
      ) : (
        <div className="space-y-4">
          <TrustHistoryChart history={history} />
          {history.length > 1 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {[...history].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/20 border border-border text-xs">
                  <span className={`aegis-mono font-bold shrink-0 w-10 ${h.trust < 50 ? 'text-red-400' : h.trust < 80 ? 'text-amber-400' : 'text-green-400'}`}>{h.trust}</span>
                  <div className="flex-1">
                    {h.reason && <div className="text-foreground">{h.reason}</div>}
                    <div className="text-muted-foreground text-[10px] aegis-mono mt-0.5">{fmtDate(h.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}