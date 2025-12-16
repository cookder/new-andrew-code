import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity } from '../types';
import { generateId } from '../lib/utils';

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => string;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivity: (id: string) => Activity | undefined;
  getActivitiesByDeal: (dealId: string) => Activity[];
  deleteActivitiesByDeal: (dealId: string) => void;
  getRecentActivities: (limit?: number) => Activity[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activityData) => {
        const id = generateId();
        const newActivity: Activity = {
          ...activityData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          activities: [...state.activities, newActivity],
        }));

        return id;
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        }));
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        }));
      },

      getActivity: (id) => {
        return get().activities.find((activity) => activity.id === id);
      },

      getActivitiesByDeal: (dealId) => {
        return get()
          .activities.filter((activity) => activity.dealId === dealId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      deleteActivitiesByDeal: (dealId) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.dealId !== dealId),
        }));
      },

      getRecentActivities: (limit = 10) => {
        return [...get().activities]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'activity-store',
    }
  )
);
