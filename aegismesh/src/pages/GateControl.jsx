import TabbedHub from '@/components/TabbedHub';
import AegisGate from '@/pages/AegisGate';
import ActionFirewall from '@/pages/ActionFirewall';
import Policies from '@/pages/Policies';
import { ShieldCheck, FileCheck, Settings } from 'lucide-react';

export default function GateControl() {
  return (
    <TabbedHub
      tabs={[
        { id: 'gate', label: 'Aegis Gate', icon: ShieldCheck, component: AegisGate },
        { id: 'firewall', label: 'Action Firewall', icon: FileCheck, component: ActionFirewall },
        { id: 'policies', label: 'Policies', icon: Settings, component: Policies },
      ]}
    />
  );
}