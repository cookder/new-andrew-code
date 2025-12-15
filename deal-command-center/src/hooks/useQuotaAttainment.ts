import { useMemo } from 'react';
import { useQuotaStore } from '../stores/quotaStore';
import { useDealStore } from '../stores/dealStore';
import {
  calculateAttainment,
  calculateCoverage,
  calculateRunRate,
  calculateTotalPipeline,
} from '../lib/calculations';
import { PIPELINE_COVERAGE_TARGET } from '../lib/constants';

export interface QuotaMetrics {
  target: number;
  closedWon: number;
  attainment: number;
  remaining: number;
  coverage: number;
  coverageTarget: number;
  runRate: number;
  daysRemaining: number;
  onTrack: boolean;
}

export function useQuotaAttainment(): QuotaMetrics {
  const getCurrentMonthQuota = useQuotaStore((state) => state.getCurrentMonthQuota);
  const deals = useDealStore((state) => state.deals);

  return useMemo(() => {
    const quota = getCurrentMonthQuota();
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    if (!quota) {
      return {
        target: 0,
        closedWon: 0,
        attainment: 0,
        remaining: 0,
        coverage: 0,
        coverageTarget: PIPELINE_COVERAGE_TARGET,
        runRate: 0,
        daysRemaining,
        onTrack: false,
      };
    }

    const activeDeals = deals.filter(
      (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
    );
    // Calculate total pipeline for coverage calculation
    calculateTotalPipeline(activeDeals);

    const attainment = calculateAttainment(quota);
    const coverage = calculateCoverage(deals, quota.target);
    const runRate = calculateRunRate(quota);
    const remaining = quota.target - quota.closedWon;

    // On track if we're ahead of pace or have enough coverage
    const dayOfMonth = now.getDate();
    const expectedProgress = (dayOfMonth / daysInMonth) * 100;
    const onTrack = attainment >= expectedProgress || coverage >= PIPELINE_COVERAGE_TARGET;

    return {
      target: quota.target,
      closedWon: quota.closedWon,
      attainment,
      remaining: Math.max(0, remaining),
      coverage,
      coverageTarget: PIPELINE_COVERAGE_TARGET,
      runRate,
      daysRemaining,
      onTrack,
    };
  }, [getCurrentMonthQuota, deals]);
}
