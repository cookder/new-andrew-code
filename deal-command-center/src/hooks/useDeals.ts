import { useMemo } from 'react';
import { useDealStore } from '../stores/dealStore';
import { useActivityStore } from '../stores/activityStore';
import type { Deal, Stage, Industry, DealType } from '../types';
import { ACTIVE_STAGES } from '../lib/constants';
import { isStuckDeal } from '../lib/calculations';

interface DealFilters {
  stage?: Stage | Stage[];
  industry?: Industry;
  dealType?: DealType;
  search?: string;
}

interface SortOptions {
  field: 'value' | 'expectedCloseDate' | 'stageEnteredDate' | 'companyName';
  direction: 'asc' | 'desc';
}

export function useDeals(filters?: DealFilters, sort?: SortOptions) {
  const deals = useDealStore((state) => state.deals);

  const filteredDeals = useMemo(() => {
    let result = [...deals];

    if (filters?.stage) {
      const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
      result = result.filter((deal) => stages.includes(deal.stage));
    }

    if (filters?.industry) {
      result = result.filter((deal) => deal.industry === filters.industry);
    }

    if (filters?.dealType) {
      result = result.filter((deal) => deal.dealType === filters.dealType);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (deal) =>
          deal.companyName.toLowerCase().includes(searchLower) ||
          deal.dealName.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [deals, filters]);

  const sortedDeals = useMemo(() => {
    if (!sort) return filteredDeals;

    return [...filteredDeals].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sort.field) {
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'expectedCloseDate':
          aVal = new Date(a.expectedCloseDate).getTime();
          bVal = new Date(b.expectedCloseDate).getTime();
          break;
        case 'stageEnteredDate':
          aVal = new Date(a.stageEnteredDate).getTime();
          bVal = new Date(b.stageEnteredDate).getTime();
          break;
        case 'companyName':
          aVal = a.companyName.toLowerCase();
          bVal = b.companyName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDeals, sort]);

  return sortedDeals;
}

export function useActiveDeals() {
  return useDeals({ stage: ACTIVE_STAGES });
}

export function useStuckDeals(): Deal[] {
  const deals = useDealStore((state) => state.deals);
  const activities = useActivityStore((state) => state.activities);

  return useMemo(() => {
    return deals.filter((deal) => isStuckDeal(deal, activities));
  }, [deals, activities]);
}

export function useDeal(id: string): Deal | undefined {
  return useDealStore((state) => state.getDeal(id));
}
