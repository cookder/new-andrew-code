import { RedFlag } from './ai-clients';

export interface HealthScoreInput {
  meddpicc: {
    metricsConfidence: number;
    economicBuyerConfidence: number;
    decisionCriteriaConfidence: number;
    decisionProcessConfidence: number;
    painConfidence: number;
    championConfidence: number;
    competitionConfidence: number;
  };
  bant: {
    budgetConfidence: number;
    authorityConfidence: number;
    needConfidence: number;
    timelineConfidence: number;
  };
  redFlags?: RedFlag[];
}

/**
 * Calculate overall health score (0-100)
 * Formula:
 * - MEDDPICC completeness (60%): % of fields with >70% confidence
 * - BANT completeness (30%): % of fields with >70% confidence
 * - Red flags penalty (10%): -5 per High severity, -2 per Medium
 */
export function calculateHealthScore(input: HealthScoreInput): number {
  const CONFIDENCE_THRESHOLD = 70;

  // Calculate MEDDPICC completeness
  const meddpiccFields = Object.values(input.meddpicc);
  const meddpiccComplete = meddpiccFields.filter(c => c > CONFIDENCE_THRESHOLD).length;
  const meddpiccScore = (meddpiccComplete / meddpiccFields.length) * 100;

  // Calculate BANT completeness
  const bantFields = Object.values(input.bant);
  const bantComplete = bantFields.filter(c => c > CONFIDENCE_THRESHOLD).length;
  const bantScore = (bantComplete / bantFields.length) * 100;

  // Calculate red flags penalty
  let redFlagPenalty = 0;
  if (input.redFlags) {
    for (const flag of input.redFlags) {
      if (flag.severity === 'High') {
        redFlagPenalty += 5;
      } else if (flag.severity === 'Medium') {
        redFlagPenalty += 2;
      }
    }
  }

  // Weighted average
  const weightedScore = (meddpiccScore * 0.6) + (bantScore * 0.3) - redFlagPenalty;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}

/**
 * Get health score color category
 */
export function getHealthScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score > 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score > 75) return 'Healthy';
  if (score >= 50) return 'At Risk';
  return 'Critical';
}
