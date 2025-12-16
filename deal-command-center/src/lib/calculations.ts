import type {
  Deal,
  Activity,
  QuotaMonth,
  Stage,
  MigrationInputs,
  MigrationResults,
  ExpansionInputs,
  ExpansionResults,
  DealConfig,
  PricingResult,
} from '../types';
import { STAGE_PROBABILITY, STUCK_DEAL_DAYS } from './constants';
import { toISODateString, getDaysRemainingInMonth, daysBetween } from './utils';
import { boxPricing } from '../data/boxPricing';

// Weighted pipeline = sum of (deal.value * deal.probability / 100)
export function calculateWeightedPipeline(deals: Deal[]): number {
  return deals.reduce((sum, deal) => {
    return sum + (deal.value * deal.probability / 100);
  }, 0);
}

// Total pipeline value (unweighted)
export function calculateTotalPipeline(deals: Deal[]): number {
  return deals.reduce((sum, deal) => sum + deal.value, 0);
}

// Days in stage = today - stageEnteredDate
export function calculateDaysInStage(deal: Deal): number {
  return daysBetween(deal.stageEnteredDate, toISODateString());
}

// Get probability for a stage
export function getProbabilityForStage(stage: Stage): number {
  return STAGE_PROBABILITY[stage];
}

// Stuck = no activity in 7+ days and not closed
export function isStuckDeal(deal: Deal, activities: Activity[]): boolean {
  if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') {
    return false;
  }

  const dealActivities = activities.filter(a => a.dealId === deal.id);

  if (dealActivities.length === 0) {
    // No activities, check days in current stage
    return calculateDaysInStage(deal) >= STUCK_DEAL_DAYS;
  }

  // Find most recent activity
  const sortedActivities = [...dealActivities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const daysSinceLastActivity = daysBetween(sortedActivities[0].date, toISODateString());
  return daysSinceLastActivity >= STUCK_DEAL_DAYS;
}

// Get stuck deals
export function getStuckDeals(deals: Deal[], activities: Activity[]): Deal[] {
  return deals.filter(deal => isStuckDeal(deal, activities));
}

// Quota attainment = closedWon / target * 100
export function calculateAttainment(quota: QuotaMonth): number {
  if (quota.target === 0) return 0;
  return (quota.closedWon / quota.target) * 100;
}

// Pipeline coverage = totalPipeline / quotaTarget
export function calculateCoverage(deals: Deal[], quotaTarget: number): number {
  if (quotaTarget === 0) return 0;
  const activePipeline = deals.filter(
    d => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  return calculateTotalPipeline(activePipeline) / quotaTarget;
}

// Required run rate = (target - closedWon) / daysRemaining
export function calculateRunRate(quota: QuotaMonth): number {
  const remaining = quota.target - quota.closedWon;
  const daysRemaining = getDaysRemainingInMonth();

  if (daysRemaining <= 0 || remaining <= 0) return 0;
  return remaining / daysRemaining;
}

// Get deals closing this month
export function getDealsClosingThisMonth(deals: Deal[]): Deal[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return deals.filter(deal => {
    if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') return false;

    const closeDate = new Date(deal.expectedCloseDate);
    return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear;
  });
}

// Get deals by stage
export function getDealsByStage(deals: Deal[]): Record<Stage, Deal[]> {
  const result: Record<Stage, Deal[]> = {
    discovery: [],
    qualification: [],
    demo: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  };

  deals.forEach(deal => {
    result[deal.stage].push(deal);
  });

  return result;
}

// Migration ROI Calculator
export function calculateMigrationROI(inputs: MigrationInputs): MigrationResults {
  const {
    numberOfUsers,
    currentCostPerUser,
    itSupportHoursPerWeek,
    averageItHourlyRate,
    securityIncidentsPerYear,
    averageIncidentCost,
    productivityHoursLostPerUserPerMonth,
    averageEmployeeHourlyRate,
  } = inputs;

  // Current costs
  const currentLicenseCost = numberOfUsers * currentCostPerUser * 12;
  const currentItSupportCost = itSupportHoursPerWeek * averageItHourlyRate * 52;
  const currentSecurityCost = securityIncidentsPerYear * averageIncidentCost;
  const currentProductivityLoss = numberOfUsers * productivityHoursLostPerUserPerMonth * averageEmployeeHourlyRate * 12;

  const currentAnnualCost = currentLicenseCost + currentItSupportCost + currentSecurityCost + currentProductivityLoss;

  // Box costs (assuming Enterprise tier)
  const boxPerUserCost = boxPricing.tiers.enterprise.annualPerUser;
  const boxAnnualCost = numberOfUsers * boxPerUserCost;

  // Estimated reductions with Box
  const itTimeSavings = currentItSupportCost * 0.6; // 60% reduction
  const securityCostReduction = currentSecurityCost * 0.7; // 70% reduction
  const productivityGains = currentProductivityLoss * 0.5; // 50% improvement

  const totalSavingsFromEfficiency = itTimeSavings + securityCostReduction + productivityGains;
  const annualSavings = currentAnnualCost - boxAnnualCost + totalSavingsFromEfficiency - currentLicenseCost;

  const threeYearSavings = annualSavings * 3;
  const roiPercentage = boxAnnualCost > 0 ? (annualSavings / boxAnnualCost) * 100 : 0;
  const paybackMonths = annualSavings > 0 ? Math.ceil((boxAnnualCost / annualSavings) * 12) : 0;

  return {
    currentAnnualCost,
    boxAnnualCost,
    annualSavings,
    threeYearSavings,
    roiPercentage,
    paybackMonths,
    itTimeSavings,
    securityCostReduction,
    productivityGains,
  };
}

// Expansion ROI Calculator
export function calculateExpansionROI(inputs: ExpansionInputs): ExpansionResults {
  const { currentUsers, newUsers, currentTier, proposedTier, addOns } = inputs;

  const currentTierPrice = boxPricing.tiers[currentTier].annualPerUser;
  const proposedTierPrice = boxPricing.tiers[proposedTier].annualPerUser;

  const currentARR = currentUsers * currentTierPrice;

  const totalUsers = currentUsers + newUsers;
  let newARR = totalUsers * proposedTierPrice;

  // Add add-on costs (simplified - using flat estimates)
  addOns.forEach(addOn => {
    const addOnInfo = boxPricing.addOns[addOn];
    if (addOnInfo.annualPerUser > 0) {
      newARR += totalUsers * addOnInfo.annualPerUser;
    }
  });

  const expansionValue = newARR - currentARR;
  const perUserIncrease = totalUsers > 0 ? (newARR / totalUsers) - (currentARR / currentUsers) : 0;

  return {
    currentARR,
    newARR,
    expansionValue,
    perUserIncrease,
  };
}

// Deal pricing calculator
export function calculateDealPricing(config: DealConfig): PricingResult {
  const { userCount, productTier, addOns, contractLength, discount } = config;

  const tierInfo = boxPricing.tiers[productTier];
  const baseTierAnnual = tierInfo.annualPerUser * userCount;

  let addOnsAnnual = 0;
  addOns.forEach(addOn => {
    const addOnInfo = boxPricing.addOns[addOn];
    if (addOnInfo.annualPerUser > 0) {
      addOnsAnnual += addOnInfo.annualPerUser * userCount;
    }
  });

  const subtotal = baseTierAnnual + addOnsAnnual;
  const discountAmount = subtotal * (discount / 100);
  const annualTotal = subtotal - discountAmount;
  const monthlyTotal = annualTotal / 12;
  const perUserMonthly = userCount > 0 ? monthlyTotal / userCount : 0;

  return {
    monthlyTotal,
    annualTotal: annualTotal * (contractLength / 12),
    perUserMonthly,
    breakdown: {
      baseTier: baseTierAnnual,
      addOns: addOnsAnnual,
      discount: discountAmount,
    },
  };
}

// Average deal size
export function calculateAverageDealSize(deals: Deal[]): number {
  const closedWonDeals = deals.filter(d => d.stage === 'closed_won');
  if (closedWonDeals.length === 0) return 0;

  const total = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);
  return total / closedWonDeals.length;
}

// Win rate
export function calculateWinRate(deals: Deal[]): number {
  const closedDeals = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost');
  if (closedDeals.length === 0) return 0;

  const wins = deals.filter(d => d.stage === 'closed_won').length;
  return (wins / closedDeals.length) * 100;
}

// Average sales cycle (days)
export function calculateAverageSalesCycle(deals: Deal[]): number {
  const closedWonDeals = deals.filter(d => d.stage === 'closed_won');
  if (closedWonDeals.length === 0) return 0;

  const totalDays = closedWonDeals.reduce((sum, deal) => {
    return sum + daysBetween(deal.createdAt, deal.updatedAt);
  }, 0);

  return Math.round(totalDays / closedWonDeals.length);
}
