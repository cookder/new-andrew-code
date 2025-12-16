import { useMemo } from 'react';
import { useDealStore } from '../stores/dealStore';
import type { Stage } from '../types';
import {
  calculateWeightedPipeline,
  calculateTotalPipeline,
  getDealsByStage,
  getDealsClosingThisMonth,
  calculateAverageDealSize,
  calculateWinRate,
} from '../lib/calculations';

export interface PipelineMetrics {
  totalPipeline: number;
  weightedPipeline: number;
  dealCount: number;
  dealsByStage: Record<Stage, number>;
  valueByStage: Record<Stage, number>;
  closingThisMonth: number;
  closingThisMonthValue: number;
  averageDealSize: number;
  winRate: number;
}

export function usePipelineMetrics(): PipelineMetrics {
  const deals = useDealStore((state) => state.deals);

  return useMemo(() => {
    const activeDeals = deals.filter(
      (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
    );

    const dealsByStageData = getDealsByStage(deals);
    const closingThisMonthDeals = getDealsClosingThisMonth(deals);

    const dealsByStage: Record<Stage, number> = {
      discovery: dealsByStageData.discovery.length,
      qualification: dealsByStageData.qualification.length,
      demo: dealsByStageData.demo.length,
      proposal: dealsByStageData.proposal.length,
      negotiation: dealsByStageData.negotiation.length,
      closed_won: dealsByStageData.closed_won.length,
      closed_lost: dealsByStageData.closed_lost.length,
    };

    const valueByStage: Record<Stage, number> = {
      discovery: calculateTotalPipeline(dealsByStageData.discovery),
      qualification: calculateTotalPipeline(dealsByStageData.qualification),
      demo: calculateTotalPipeline(dealsByStageData.demo),
      proposal: calculateTotalPipeline(dealsByStageData.proposal),
      negotiation: calculateTotalPipeline(dealsByStageData.negotiation),
      closed_won: calculateTotalPipeline(dealsByStageData.closed_won),
      closed_lost: calculateTotalPipeline(dealsByStageData.closed_lost),
    };

    return {
      totalPipeline: calculateTotalPipeline(activeDeals),
      weightedPipeline: calculateWeightedPipeline(activeDeals),
      dealCount: activeDeals.length,
      dealsByStage,
      valueByStage,
      closingThisMonth: closingThisMonthDeals.length,
      closingThisMonthValue: calculateTotalPipeline(closingThisMonthDeals),
      averageDealSize: calculateAverageDealSize(deals),
      winRate: calculateWinRate(deals),
    };
  }, [deals]);
}
