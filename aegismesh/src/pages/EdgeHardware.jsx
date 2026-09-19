import { useEffect, useState } from 'react';
import { Panel, StatusBadge } from '@/components/aegis';
import { EDGE_DEVICES } from '@/lib/aegisEngine';
import { Cpu, Activity, AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EdgeHardware() {
  const [confirmRelay, setConfirmRelay] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [edgeStatus, setEdgeStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const refreshStatus = async () => {
    setLoadingStatus(true);
    try { setEdgeStatus(await base44.api.edgeStatus()); }
    catch (e) { setEdgeStatus({ mode: 'ERROR', ok: false, message: e.message }); }
    finally { setLoadingStatus(false); }
  };

  useEffect(() => { refreshStatus(); }, []);

  const runTest = async (device, label) => {
    if (label === 'TEST RELAY' && !confirmRelay) {
      setConfirmRelay(true);
      return;
    }
    setConfirmRelay(false);
    const test = label.replace('TEST ', '');
    setTestResult({ device, test: label, result: 'RUNNING', mode: 'LOCAL', ts: Date.now() });
    try {
      const out = await base44.api.edgeTest({ test });
      setTestResult({ device, test: label, result: out.result || 'PASS', mode: out.mode || 'LIVE', ts: Date.now() });
      refreshStatus();
    } catch (e) {
      setTestResult({ device, test: label, result: e.message, mode: 'ERROR', ts: Date.now() });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Edge Hardware</h1>
          <p className="text-sm text-muted-foreground mt-1">Aegis Edge — physical enforcement layer with signed, short-lived execution capabilities</p>
        </div>
        <button onClick={refreshStatus} disabled={loadingStatus} className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs hover:border-primary/40 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} /> Refresh edge
        </button>
      </div>

      <div className="aegis-hard-panel p-4 flex flex-wrap items-center gap-4">
        <div className="w-10 h-10 border border-primary/30 bg-primary/10 grid place-items-center"><Radio className="w-5 h-5 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="font-bold text-sm">Enforcement service</span><StatusBadge status={edgeStatus?.mode || 'WAITING'} /></div>
          <div className="text-xs text-muted-foreground mt-1 truncate">{edgeStatus?.message || edgeStatus?.service || 'Checking Aegis Edge status…'}</div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[10px] aegis-mono text-muted-foreground">
          <span>GPIO</span><span className="text-foreground">{edgeStatus?.gpio === true ? 'ACTIVE' : edgeStatus?.gpio === false ? 'SIMULATED' : '—'}</span>
          <span>Relay</span><span className="text-foreground">{edgeStatus?.relay || '—'}</span>
        </div>
      </div>

      <Panel title="Execution Path" subtitle="The model never talks to the relay directly">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {['AEGIS GATE', 'SIGNED CAPABILITY', 'EDGE VERIFY', 'RELAY', 'ASSET'].map((step, i) => (
            <div key={step} className="flex items-center shrink-0">
              <div className="px-4 py-2.5 bg-muted/30 border border-border text-xs aegis-mono text-center min-w-[128px] aegis-corner-cut">
                <div className="text-primary font-bold">{i + 1}</div>
                <div className="mt-0.5">{step}</div>
              </div>
              {i < 4 && <div className="w-7 h-px bg-primary/30 mx-0.5 relative"><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 animate-aegis-pulse" /></div>}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EDGE_DEVICES.map(d => (
          <div key={d.id} className="aegis-hard-panel p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <div><div className="font-display font-bold text-sm">{d.name}</div><div className="text-[10px] text-muted-foreground aegis-mono">{d.id}</div></div>
              </div>
              <StatusBadge status={edgeStatus?.mode === 'LIVE' ? d.status : d.status} />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="aegis-mono">{d.ip}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Firmware</span><span className="aegis-mono">{d.firmware}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heartbeat</span><span className="text-green-400">{d.last_heartbeat}</span></div>
            </div>
            <div className="mt-3">
              <div className="text-[10px] aegis-mono text-muted-foreground mb-1.5">CAPABILITIES</div>
              <div className="flex flex-wrap gap-1">{d.capabilities.map(c => <span key={c} className="text-[10px] aegis-mono px-1.5 py-0.5 bg-muted/30 border border-border">{c}</span>)}</div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {getTestButton(d).map(test => (
                <button key={test} onClick={() => runTest(d.name, test)} className="flex-1 text-[10px] aegis-mono px-2 py-1.5 bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition aegis-corner-cut">
                  {confirmRelay && test === 'TEST RELAY' ? 'CONFIRM RELAY?' : test}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {testResult && (
        <div className={`aegis-hard-panel p-4 animate-aegis-fade-up ${testResult.mode === 'ERROR' ? 'border-red-500/30 aegis-glow-red' : 'border-green-500/30 aegis-glow-green'}`}>
          <div className="flex items-center gap-2"><Activity className={`w-5 h-5 ${testResult.mode === 'ERROR' ? 'text-red-400' : 'text-green-400'}`} /><span className="font-medium text-sm">{testResult.device} — {testResult.test}</span><StatusBadge status={testResult.mode} /></div>
          <div className="text-xs text-muted-foreground mt-2">{testResult.result}</div>
        </div>
      )}

      <div className="aegis-hard-panel p-4 border-amber-500/20">
        <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /><div className="text-xs text-muted-foreground"><span className="text-amber-400 font-medium">Safety:</span> The relay switches only a safe low-voltage demo load or simulated network isolation. Relay testing is simulation-only unless <span className="aegis-mono">EDGE_ALLOW_RELAY_TEST=true</span> is explicitly set on the Pi.</div></div>
      </div>
    </div>
  );
}

function getTestButton(d) {
  if (d.type === 'led') return ['TEST LED'];
  if (d.type === 'buzzer') return ['TEST BUZZER'];
  if (d.type === 'nfc') return ['TEST NFC'];
  if (d.type === 'relay') return ['TEST RELAY'];
  return [];
}
