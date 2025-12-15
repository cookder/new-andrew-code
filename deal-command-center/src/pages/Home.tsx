import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Section } from '../components/layout/PageContainer';
import { SimpleHeader } from '../components/layout/Header';
import { QuotaCard } from '../components/dashboard/QuotaCard';
import { PipelineSummary } from '../components/dashboard/PipelineSummary';
import { TodaysFocus } from '../components/dashboard/TodaysFocus';
import { StuckDealsAlert } from '../components/dashboard/StuckDealsAlert';
import { Button } from '../components/ui/Button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full">
      <SimpleHeader title="Deal Command Center" />
      <PageContainer>
        <Section>
          <QuotaCard />
        </Section>

        <StuckDealsAlert />

        <Section title="Pipeline Overview" className="mt-4">
          <PipelineSummary />
        </Section>

        <Section title="Focus Areas">
          <TodaysFocus />
        </Section>

        {/* FAB for quick actions */}
        <div className="fixed bottom-20 right-4">
          <Button
            onClick={() => navigate('/deals/new')}
            className="w-14 h-14 rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
