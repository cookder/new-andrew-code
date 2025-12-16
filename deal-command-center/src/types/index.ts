// Deal stages with probability mapping
export type Stage =
  | 'discovery'      // 10%
  | 'qualification'  // 20%
  | 'demo'           // 40%
  | 'proposal'       // 60%
  | 'negotiation'    // 80%
  | 'closed_won'     // 100%
  | 'closed_lost';   // 0%

export type Industry =
  | 'construction'
  | 'legal'
  | 'healthcare'
  | 'financial_services'
  | 'manufacturing'
  | 'professional_services'
  | 'other';

export type ProductTier =
  | 'business'
  | 'business_plus'
  | 'enterprise'
  | 'enterprise_plus'
  | 'enterprise_advanced';

export type AddOn =
  | 'box_ai'
  | 'shield'
  | 'governance'
  | 'sign'
  | 'relay'
  | 'platform';

export type DealType = 'new_logo' | 'expansion' | 'renewal' | 'displacement';

export type NextStepOwner = 'me' | 'prospect';

export interface Deal {
  id: string;
  companyName: string;
  dealName: string;
  value: number;                    // ARR in dollars
  probability: number;              // 0-100
  stage: Stage;
  stageEnteredDate: string;         // ISO date
  expectedCloseDate: string;        // ISO date
  dealType: DealType;
  industry: Industry;
  tags: string[];

  // Deal Intelligence
  currentSituation: string;
  desiredOutcome: string;
  quantifiedImpact: string;         // The "$X problem"
  decisionProcess: string;
  competition: string;
  whyWeWin: string;
  risks: string;

  // Next Steps
  nextStep: string;
  nextStepOwner: NextStepOwner;
  nextStepDueDate: string | null;

  // Deal Configuration
  userCount: number;
  productTier: ProductTier;
  addOns: AddOn[];

  createdAt: string;
  updatedAt: string;
}

export type ContactRole =
  | 'economic_buyer'
  | 'technical_buyer'
  | 'champion'
  | 'influencer'
  | 'blocker'
  | 'end_user'
  | 'procurement';

export type EngagementLevel = 'hot' | 'warm' | 'cold';

export interface Contact {
  id: string;
  dealId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role: ContactRole;
  engagementLevel: EngagementLevel;
  lastContactDate: string | null;
  notes: string;
  createdAt: string;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'demo'
  | 'proposal_sent'
  | 'other';

export type ActivityOutcome = 'positive' | 'neutral' | 'negative' | 'no_contact';

export interface Activity {
  id: string;
  dealId: string;
  type: ActivityType;
  date: string;                     // ISO datetime
  summary: string;
  outcome: ActivityOutcome;
  createdAt: string;
}

export interface QuotaMonth {
  id: string;
  month: number;                    // 1-12
  year: number;
  target: number;
  closedWon: number;
}

// Calculator Types
export interface MigrationInputs {
  currentSolution: string;
  numberOfUsers: number;
  currentCostPerUser: number;
  itSupportHoursPerWeek: number;
  averageItHourlyRate: number;
  securityIncidentsPerYear: number;
  averageIncidentCost: number;
  productivityHoursLostPerUserPerMonth: number;
  averageEmployeeHourlyRate: number;
}

export interface MigrationResults {
  currentAnnualCost: number;
  boxAnnualCost: number;
  annualSavings: number;
  threeYearSavings: number;
  roiPercentage: number;
  paybackMonths: number;
  itTimeSavings: number;
  securityCostReduction: number;
  productivityGains: number;
}

export interface ExpansionInputs {
  currentUsers: number;
  newUsers: number;
  currentTier: ProductTier;
  proposedTier: ProductTier;
  addOns: AddOn[];
}

export interface ExpansionResults {
  currentARR: number;
  newARR: number;
  expansionValue: number;
  perUserIncrease: number;
}

export interface DealConfig {
  userCount: number;
  productTier: ProductTier;
  addOns: AddOn[];
  contractLength: number;
  discount: number;
}

export interface PricingResult {
  monthlyTotal: number;
  annualTotal: number;
  perUserMonthly: number;
  breakdown: {
    baseTier: number;
    addOns: number;
    discount: number;
  };
}

// UI Types
export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface SortOption {
  value: string;
  label: string;
  direction: 'asc' | 'desc';
}
