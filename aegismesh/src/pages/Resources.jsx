import TabbedHub from '@/components/TabbedHub';
import FieldMode from '@/pages/FieldMode';
import Platform from '@/pages/Platform';
import Codex from '@/pages/Codex';
import { Network, Server, BookOpen } from 'lucide-react';

export default function Resources() {
  return (
    <TabbedHub
      tabs={[
        { id: 'field', label: 'OMNI Field', icon: Network, component: FieldMode },
        { id: 'platform', label: 'Platform', icon: Server, component: Platform },
        { id: 'codex', label: 'Codex', icon: BookOpen, component: Codex },
      ]}
    />
  );
}