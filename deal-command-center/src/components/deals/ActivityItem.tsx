import React from 'react';
import {
  Phone,
  Mail,
  Users,
  FileText,
  Monitor,
  Send,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  XCircle,
} from 'lucide-react';
import type { Activity, ActivityType, ActivityOutcome } from '../../types';
import { ACTIVITY_TYPE_LABELS, OUTCOME_COLORS } from '../../lib/constants';
import { formatDate, formatRelativeDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  demo: Monitor,
  proposal_sent: Send,
  other: MoreHorizontal,
};

const outcomeIcons: Record<ActivityOutcome, React.ComponentType<{ className?: string }>> = {
  positive: ArrowUp,
  neutral: Minus,
  negative: ArrowDown,
  no_contact: XCircle,
};

interface ActivityItemProps {
  activity: Activity;
  showDate?: 'relative' | 'full';
}

export function ActivityItem({ activity, showDate = 'relative' }: ActivityItemProps) {
  const Icon = activityIcons[activity.type];
  const OutcomeIcon = outcomeIcons[activity.outcome];

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          <OutcomeIcon
            className={cn('w-3.5 h-3.5', OUTCOME_COLORS[activity.outcome])}
          />
          <span className="text-xs text-gray-400 ml-auto">
            {showDate === 'relative'
              ? formatRelativeDate(activity.date)
              : formatDate(activity.date)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{activity.summary}</p>
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
  emptyMessage?: string;
}

export function ActivityTimeline({
  activities,
  emptyMessage = 'No activities yet',
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
