import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TabbedHub({ tabs }) {
  const [params, setParams] = useSearchParams();
  const current = params.get('tab');
  const active = tabs.some(t => t.id === current) ? current : tabs[0].id;

  return (
    <Tabs value={active} onValueChange={(v) => setParams({ tab: v })}>
      <div className="px-6 pt-5 pb-1 border-b border-border bg-card/30 sticky top-0 z-20 backdrop-blur-md">
        <TabsList>
          {tabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              {t.icon && <t.icon className="w-3.5 h-3.5" />}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map(t => (
        <TabsContent key={t.id} value={t.id} className="mt-0">
          <t.component />
        </TabsContent>
      ))}
    </Tabs>
  );
}