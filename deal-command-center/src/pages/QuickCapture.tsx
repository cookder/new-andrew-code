import React, { useState } from 'react';
import { Phone, Mail, Users, FileText, Monitor, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useActivityStore } from '../stores/activityStore';
import type { ActivityType, ActivityOutcome } from '../types';
import { ACTIVITY_TYPE_LABELS } from '../lib/constants';
import { cn } from '../lib/utils';

interface QuickCaptureProps {
  dealId: string;
  onComplete: () => void;
}

const activityTypeIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  demo: Monitor,
  proposal_sent: Send,
  other: MoreHorizontal,
};

export function QuickCapture({ dealId, onComplete }: QuickCaptureProps) {
  const addActivity = useActivityStore((state) => state.addActivity);

  const [type, setType] = useState<ActivityType>('call');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState<ActivityOutcome>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!summary.trim()) return;

    addActivity({
      dealId,
      type,
      summary: summary.trim(),
      outcome,
      date: new Date().toISOString(),
    });

    onComplete();
  };

  const outcomeOptions = [
    { value: 'positive', label: 'Positive - Moving Forward' },
    { value: 'neutral', label: 'Neutral - Status Quo' },
    { value: 'negative', label: 'Negative - Risk Identified' },
    { value: 'no_contact', label: 'No Contact - Left Message' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Activity Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activity Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(activityTypeIcons) as ActivityType[]).map((actType) => {
            const Icon = activityTypeIcons[actType];
            const isSelected = type === actType;

            return (
              <button
                key={actType}
                type="button"
                onClick={() => setType(actType)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{ACTIVITY_TYPE_LABELS[actType]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <TextArea
        label="What happened?"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Brief summary of the interaction..."
        rows={3}
        required
      />

      {/* Outcome */}
      <Select
        label="Outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value as ActivityOutcome)}
        options={outcomeOptions}
      />

      {/* Submit */}
      <Button type="submit" fullWidth disabled={!summary.trim()}>
        Log Activity
      </Button>
    </form>
  );
}

// Standalone page version for direct navigation
export function QuickCapturePage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">
            Quick capture is accessible from the deal detail page.
          </p>
        </div>
      </div>
    </div>
  );
}
