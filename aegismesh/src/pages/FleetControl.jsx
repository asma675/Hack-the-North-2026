import TabbedHub from '@/components/TabbedHub';
import AgentFleet from '@/pages/AgentFleet';
import TrustCenter from '@/pages/TrustCenter';
import { Users, Shield } from 'lucide-react';

export default function FleetControl() {
  return (
    <TabbedHub
      tabs={[
        { id: 'fleet', label: 'Agent Fleet', icon: Users, component: AgentFleet },
        { id: 'trust', label: 'Trust Center', icon: Shield, component: TrustCenter },
      ]}
    />
  );
}