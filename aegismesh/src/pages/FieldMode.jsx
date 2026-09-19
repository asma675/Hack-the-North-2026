import { useState } from 'react';
import { Panel, StatusBadge } from '@/components/aegis';
import { Camera, Mic, Send, MapPin } from 'lucide-react';

export default function FieldMode() {
  const [observation, setObservation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-[800px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Huawei OMNI Field Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Multimodal field evidence — point camera at infrastructure, speak observations</p>
      </div>

      <div className="aegis-panel rounded-lg p-4 border-amber-500/20">
        <div className="text-xs text-muted-foreground">
          <span className="text-amber-400 font-medium aegis-mono">DEMO SIMULATION:</span> Camera and microphone inputs are simulated in demo mode.
          When connected to Huawei OMNI, real vision and speech are processed.
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="aegis-panel rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="absolute inset-0 aegis-grid opacity-30" />
          <div className="text-center">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">Camera viewfinder</div>
            <div className="text-[10px] aegis-mono text-muted-foreground mt-1">Point at infrastructure to capture visual evidence</div>
          </div>
          {/* Simulated detection overlay */}
          <div className="absolute top-4 left-4 px-2 py-1 rounded bg-red-500/20 border border-red-500/40 text-[10px] aegis-mono text-red-400">
            ● PORT 3 — FAULT INDICATOR
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[10px] aegis-mono text-muted-foreground">
            <MapPin className="w-3 h-3" /> Data Center Rack B-3
          </div>
        </div>
      </div>

      {/* Speech input */}
      <div className="aegis-panel rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Technician Report</span>
        </div>
        <textarea
          value={observation}
          onChange={e => setObservation(e.target.value)}
          placeholder="“Port three is red and the fan sounds abnormal. Should I disconnect it?”"
          className="w-full p-3 rounded bg-muted/20 border border-border text-sm resize-none focus:outline-none focus:border-primary/30"
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!observation && !submitted}
          className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded bg-primary/10 text-primary border border-primary/30 text-sm hover:bg-primary/20 transition disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" /> Send to Incident
        </button>
      </div>

      {/* Result */}
      {submitted && (
        <div className="aegis-panel rounded-lg p-5 animate-aegis-fade-up">
          <div className="text-[10px] aegis-mono text-muted-foreground mb-3">FIELD OBSERVATION</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Visual</span>
              <span>Port 3 shows fault indication (red LED)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Audio</span>
              <span>Possible cooling/fan anomaly detected</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Report</span>
              <span>Suspected hardware problem</span>
            </div>
            <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20">
              <div className="text-[10px] aegis-mono text-amber-400">RECOMMENDATION</div>
              <div className="text-sm mt-1">Do not disconnect yet. Submit evidence to incident swarm for correlation.</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-xs">Confidence</span>
                <span className="text-lg font-bold aegis-text-cyan ml-2">87%</span>
              </div>
              <StatusBadge status="APPROVED" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}