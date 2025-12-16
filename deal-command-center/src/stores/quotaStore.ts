import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuotaMonth } from '../types';
import { generateId } from '../lib/utils';

interface QuotaState {
  quotaMonths: QuotaMonth[];
  getCurrentMonthQuota: () => QuotaMonth | undefined;
  getQuotaMonth: (month: number, year: number) => QuotaMonth | undefined;
  setQuotaTarget: (month: number, year: number, target: number) => void;
  addClosedWon: (month: number, year: number, amount: number) => void;
  updateClosedWon: (month: number, year: number, closedWon: number) => void;
}

export const useQuotaStore = create<QuotaState>()(
  persist(
    (set, get) => ({
      quotaMonths: [],

      getCurrentMonthQuota: () => {
        const now = new Date();
        return get().getQuotaMonth(now.getMonth() + 1, now.getFullYear());
      },

      getQuotaMonth: (month, year) => {
        return get().quotaMonths.find(
          (q) => q.month === month && q.year === year
        );
      },

      setQuotaTarget: (month, year, target) => {
        set((state) => {
          const existing = state.quotaMonths.find(
            (q) => q.month === month && q.year === year
          );

          if (existing) {
            return {
              quotaMonths: state.quotaMonths.map((q) =>
                q.month === month && q.year === year
                  ? { ...q, target }
                  : q
              ),
            };
          }

          return {
            quotaMonths: [
              ...state.quotaMonths,
              { id: generateId(), month, year, target, closedWon: 0 },
            ],
          };
        });
      },

      addClosedWon: (month, year, amount) => {
        set((state) => {
          const existing = state.quotaMonths.find(
            (q) => q.month === month && q.year === year
          );

          if (existing) {
            return {
              quotaMonths: state.quotaMonths.map((q) =>
                q.month === month && q.year === year
                  ? { ...q, closedWon: q.closedWon + amount }
                  : q
              ),
            };
          }

          return {
            quotaMonths: [
              ...state.quotaMonths,
              { id: generateId(), month, year, target: 0, closedWon: amount },
            ],
          };
        });
      },

      updateClosedWon: (month, year, closedWon) => {
        set((state) => {
          const existing = state.quotaMonths.find(
            (q) => q.month === month && q.year === year
          );

          if (existing) {
            return {
              quotaMonths: state.quotaMonths.map((q) =>
                q.month === month && q.year === year
                  ? { ...q, closedWon }
                  : q
              ),
            };
          }

          return {
            quotaMonths: [
              ...state.quotaMonths,
              { id: generateId(), month, year, target: 0, closedWon },
            ],
          };
        });
      },
    }),
    {
      name: 'quota-store',
    }
  )
);
