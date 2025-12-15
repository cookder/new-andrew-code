import { Fragment } from 'react';
import { Check } from 'lucide-react';
import type { Stage } from '../../types';
import { STAGE_LABELS, STAGE_PROBABILITY, ACTIVE_STAGES } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface StageSelectorProps {
  currentStage: Stage;
  onStageChange: (stage: Stage) => void;
  showProbability?: boolean;
}

export function StageSelector({
  currentStage,
  onStageChange,
  showProbability = true,
}: StageSelectorProps) {
  return (
    <div className="space-y-2">
      {ACTIVE_STAGES.map((stage) => {
        const isSelected = currentStage === stage;
        const probability = STAGE_PROBABILITY[stage];

        return (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span
                className={cn(
                  'font-medium',
                  isSelected ? 'text-primary-700' : 'text-gray-700'
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {showProbability && (
              <span className="text-sm text-gray-500">{probability}%</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface StagePipelineProps {
  currentStage: Stage;
  compact?: boolean;
}

export function StagePipeline({ currentStage, compact = false }: StagePipelineProps) {
  const stageIndex = ACTIVE_STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1">
      {ACTIVE_STAGES.map((stage, index) => {
        const isPast = index < stageIndex;
        const isCurrent = index === stageIndex;

        return (
          <Fragment key={stage}>
            <div
              className={cn(
                'rounded-full transition-colors',
                compact ? 'w-2 h-2' : 'w-3 h-3',
                isPast || isCurrent
                  ? 'bg-primary-500'
                  : 'bg-gray-200'
              )}
              title={STAGE_LABELS[stage]}
            />
            {index < ACTIVE_STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1',
                  isPast ? 'bg-primary-500' : 'bg-gray-200'
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
