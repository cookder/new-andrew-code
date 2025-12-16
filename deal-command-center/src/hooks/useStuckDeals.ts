import { useMemo } from 'react';
import { useDealStore } from '../stores/dealStore';
import { useActivityStore } from '../stores/activityStore';
import type { Deal } from '../types';
import { getStuckDeals, calculateDaysInStage } from '../lib/calculations';

export interface StuckDealInfo {
  deal: Deal;
  daysStuck: number;
  lastActivityDate: string | null;
}

export function useStuckDealsWithInfo(): StuckDealInfo[] {
  const deals = useDealStore((state) => state.deals);
  const activities = useActivityStore((state) => state.activities);

  return useMemo(() => {
    const stuckDeals = getStuckDeals(deals, activities);

    return stuckDeals.map((deal) => {
      const dealActivities = activities
        .filter((a) => a.dealId === deal.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        deal,
        daysStuck: calculateDaysInStage(deal),
        lastActivityDate: dealActivities[0]?.date || null,
      };
    });
  }, [deals, activities]);
}
