import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// OpenAI Client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Anthropic Client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Google Gemini Client
export const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Type definitions for AI responses
export interface MEDDPICCElement {
  value: string;
  confidence: number;
  sources: string[];
}

export interface BANTElement {
  value: string;
  confidence: number;
  sources: string[];
}

export interface MEDDPICCResponse {
  metrics: MEDDPICCElement;
  economicBuyer: MEDDPICCElement;
  decisionCriteria: MEDDPICCElement;
  decisionProcess: MEDDPICCElement;
  pain: MEDDPICCElement;
  champion: MEDDPICCElement;
  competition: MEDDPICCElement;
}

export interface BANTResponse {
  budget: BANTElement;
  authority: BANTElement;
  need: BANTElement;
  timeline: BANTElement;
}

export interface RedFlag {
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  confidence: number;
  sources?: string[];
}

export interface NextAction {
  priority: number;
  action: string;
  rationale: string;
  confidence: number;
}

export interface AIAnalysisResult {
  meddpicc: MEDDPICCResponse;
  bant: BANTResponse;
  redFlags: RedFlag[];
  nextActions: NextAction[];
  stakeholderGaps?: string;
  stakeholderGapsConfidence?: number;
  budgetTimelineSignals?: string;
  budgetTimelineSignalsConfidence?: number;
  painPointQualification?: string;
  painPointQualificationConfidence?: number;
  competitiveIntelligence?: string;
  competitiveIntelligenceConfidence?: number;
  stageRecommendation?: string;
  stageRecommendationRationale?: string;
  stageRecommendationConfidence?: number;
}
