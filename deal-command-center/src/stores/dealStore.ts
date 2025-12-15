import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deal, Stage } from '../types';
import { generateId, toISODateString } from '../lib/utils';
import { STAGE_PROBABILITY } from '../lib/constants';

interface DealState {
  deals: Deal[];
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  getDeal: (id: string) => Deal | undefined;
  updateStage: (id: string, stage: Stage) => void;
}

const createEmptyDeal = (): Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> => ({
  companyName: '',
  dealName: '',
  value: 0,
  probability: STAGE_PROBABILITY.discovery,
  stage: 'discovery',
  stageEnteredDate: toISODateString(),
  expectedCloseDate: toISODateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
  dealType: 'new_logo',
  industry: 'other',
  tags: [],
  currentSituation: '',
  desiredOutcome: '',
  quantifiedImpact: '',
  decisionProcess: '',
  competition: '',
  whyWeWin: '',
  risks: '',
  nextStep: '',
  nextStepOwner: 'me',
  nextStepDueDate: null,
  userCount: 0,
  productTier: 'enterprise',
  addOns: [],
});

export const useDealStore = create<DealState>()(
  persist(
    (set, get) => ({
      deals: [],

      addDeal: (dealData) => {
        const id = generateId();
        const now = toISODateString();
        const newDeal: Deal = {
          ...createEmptyDeal(),
          ...dealData,
          id,
          probability: STAGE_PROBABILITY[dealData.stage || 'discovery'],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          deals: [...state.deals, newDeal],
        }));

        return id;
      },

      updateDeal: (id, updates) => {
        set((state) => ({
          deals: state.deals.map((deal) =>
            deal.id === id
              ? { ...deal, ...updates, updatedAt: toISODateString() }
              : deal
          ),
        }));
      },

      deleteDeal: (id) => {
        set((state) => ({
          deals: state.deals.filter((deal) => deal.id !== id),
        }));
      },

      getDeal: (id) => {
        return get().deals.find((deal) => deal.id === id);
      },

      updateStage: (id, stage) => {
        set((state) => ({
          deals: state.deals.map((deal) =>
            deal.id === id
              ? {
                  ...deal,
                  stage,
                  probability: STAGE_PROBABILITY[stage],
                  stageEnteredDate: toISODateString(),
                  updatedAt: toISODateString(),
                }
              : deal
          ),
        }));
      },
    }),
    {
      name: 'deal-store',
    }
  )
);
