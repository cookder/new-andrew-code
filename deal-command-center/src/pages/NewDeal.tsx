import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Header } from '../components/layout/Header';
import { DealForm } from '../components/deals/DealForm';
import { useDealStore } from '../stores/dealStore';
import type { Deal } from '../types';

export function NewDeal() {
  const navigate = useNavigate();
  const addDeal = useDealStore((state) => state.addDeal);

  const handleSubmit = (data: Partial<Deal>) => {
    const id = addDeal(data as Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>);
    navigate(`/deals/${id}`);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header title="New Deal" showBack />
      <PageContainer>
        <DealForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/deals')}
        />
      </PageContainer>
    </div>
  );
}
