import TabbedHub from '@/components/TabbedHub';
import Integrations from '@/pages/Integrations';
import EdgeHardware from '@/pages/EdgeHardware';
import Observability from '@/pages/Observability';
import { Plug, Cpu, Microscope } from 'lucide-react';

export default function Infrastructure() {
  return (
    <TabbedHub
      tabs={[
        { id: 'integrations', label: 'Integrations', icon: Plug, component: Integrations },
        { id: 'edge', label: 'Edge Hardware', icon: Cpu, component: EdgeHardware },
        { id: 'observability', label: 'Observability', icon: Microscope, component: Observability },
      ]}
    />
  );
}