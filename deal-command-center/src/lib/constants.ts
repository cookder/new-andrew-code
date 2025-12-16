import type { Stage, Industry, ProductTier, AddOn, DealType, ContactRole, ActivityType } from '../types';

export const STAGE_PROBABILITY: Record<Stage, number> = {
  discovery: 10,
  qualification: 20,
  demo: 40,
  proposal: 60,
  negotiation: 80,
  closed_won: 100,
  closed_lost: 0,
};

export const STAGE_LABELS: Record<Stage, string> = {
  discovery: 'Discovery',
  qualification: 'Qualification',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export const STAGE_COLORS: Record<Stage, string> = {
  discovery: 'bg-gray-100 text-gray-800',
  qualification: 'bg-blue-100 text-blue-800',
  demo: 'bg-purple-100 text-purple-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
};

export const ACTIVE_STAGES: Stage[] = [
  'discovery',
  'qualification',
  'demo',
  'proposal',
  'negotiation',
];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  construction: 'Construction',
  legal: 'Legal',
  healthcare: 'Healthcare',
  financial_services: 'Financial Services',
  manufacturing: 'Manufacturing',
  professional_services: 'Professional Services',
  other: 'Other',
};

export const PRODUCT_TIER_LABELS: Record<ProductTier, string> = {
  business: 'Business',
  business_plus: 'Business Plus',
  enterprise: 'Enterprise',
  enterprise_plus: 'Enterprise Plus',
  enterprise_advanced: 'Enterprise Advanced',
};

export const ADD_ON_LABELS: Record<AddOn, string> = {
  box_ai: 'Box AI',
  shield: 'Shield',
  governance: 'Governance',
  sign: 'Sign',
  relay: 'Relay',
  platform: 'Platform',
};

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  new_logo: 'New Logo',
  expansion: 'Expansion',
  renewal: 'Renewal',
  displacement: 'Displacement',
};

export const DEAL_TYPE_COLORS: Record<DealType, string> = {
  new_logo: 'bg-green-100 text-green-800',
  expansion: 'bg-blue-100 text-blue-800',
  renewal: 'bg-gray-100 text-gray-800',
  displacement: 'bg-purple-100 text-purple-800',
};

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  economic_buyer: 'Economic Buyer',
  technical_buyer: 'Technical Buyer',
  champion: 'Champion',
  influencer: 'Influencer',
  blocker: 'Blocker',
  end_user: 'End User',
  procurement: 'Procurement',
};

export const CONTACT_ROLE_COLORS: Record<ContactRole, string> = {
  economic_buyer: 'bg-green-100 text-green-800',
  technical_buyer: 'bg-blue-100 text-blue-800',
  champion: 'bg-purple-100 text-purple-800',
  influencer: 'bg-gray-100 text-gray-800',
  blocker: 'bg-red-100 text-red-800',
  end_user: 'bg-gray-100 text-gray-800',
  procurement: 'bg-yellow-100 text-yellow-800',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  demo: 'Demo',
  proposal_sent: 'Proposal Sent',
  other: 'Other',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  call: 'Phone',
  email: 'Mail',
  meeting: 'Users',
  note: 'FileText',
  demo: 'Monitor',
  proposal_sent: 'Send',
  other: 'MoreHorizontal',
};

export const OUTCOME_COLORS: Record<string, string> = {
  positive: 'text-green-600',
  neutral: 'text-gray-600',
  negative: 'text-red-600',
  no_contact: 'text-gray-400',
};

// Stuck deal threshold in days
export const STUCK_DEAL_DAYS = 7;

// Pipeline coverage target
export const PIPELINE_COVERAGE_TARGET = 3;

// Default contract length in months
export const DEFAULT_CONTRACT_LENGTH = 12;
