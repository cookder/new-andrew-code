import { googleAI, openai, anthropic, AIAnalysisResult, MEDDPICCResponse, BANTResponse, RedFlag, NextAction } from './ai-clients';

interface AnalysisContext {
  accountName: string;
  opportunityName: string;
  currentStage: string;
  documents: Array<{
    fileName: string;
    fileContent: string;
    documentType: string;
  }>;
  currentMEDDPICC?: any;
  currentBANT?: any;
}

/**
 * Generate MEDDPICC/BANT extraction prompt
 */
function getMEDDPICCPrompt(context: AnalysisContext): string {
  const documentsText = context.documents
    .map((doc, idx) => `--- Document ${idx + 1}: ${doc.fileName} (${doc.documentType}) ---\n${doc.fileContent}`)
    .join('\n\n');

  return `You are analyzing sales conversations to extract MEDDPICC/BANT qualification information.

CONTEXT:
Account: ${context.accountName}
Opportunity: ${context.opportunityName}
Current Stage: ${context.currentStage}

DOCUMENTS:
${documentsText}

TASK:
Extract the following information with confidence scores (0-100) and source quotes:

MEDDPICC:
- Metrics: What quantifiable outcomes does the customer need?
- Economic Buyer: Who has budget authority? (Provide contact name if identifiable)
- Decision Criteria: What are their evaluation criteria?
- Decision Process: What is their buying process/timeline?
- Identify Pain: What specific problems are they solving?
- Champion: Who is internally advocating for this solution?
- Competition: Who else are they evaluating?

BANT:
- Budget: What budget information is confirmed?
- Authority: Who are the decision makers?
- Need: How validated is their business need?
- Timeline: What is their purchase timeline?

OUTPUT FORMAT (JSON only, no other text):
{
  "meddpicc": {
    "metrics": {"value": "...", "confidence": 85, "sources": ["doc1, line 45"]},
    "economicBuyer": {"value": "...", "confidence": 70, "sources": ["doc2"]},
    "decisionCriteria": {"value": "...", "confidence": 60, "sources": []},
    "decisionProcess": {"value": "...", "confidence": 75, "sources": []},
    "pain": {"value": "...", "confidence": 90, "sources": []},
    "champion": {"value": "...", "confidence": 65, "sources": []},
    "competition": {"value": "...", "confidence": 50, "sources": []}
  },
  "bant": {
    "budget": {"value": "...", "confidence": 70, "sources": []},
    "authority": {"value": "...", "confidence": 80, "sources": []},
    "need": {"value": "...", "confidence": 85, "sources": []},
    "timeline": {"value": "...", "confidence": 75, "sources": []}
  }
}

Be precise. Only claim high confidence (>80) when explicitly stated. Use quotes from documents as sources.`;
}

/**
 * Generate Red Flags prompt
 */
function getRedFlagsPrompt(context: AnalysisContext): string {
  const documentsText = context.documents
    .map((doc, idx) => `--- Document ${idx + 1}: ${doc.fileName} ---\n${doc.fileContent}`)
    .join('\n\n');

  return `You are a sales coach analyzing deal risk factors.

CONTEXT:
Account: ${context.accountName}
Opportunity: ${context.opportunityName}
Current Stage: ${context.currentStage}

DOCUMENTS:
${documentsText}

TASK:
Identify red flags and risks that could derail this deal. For each risk:
- Severity: High/Medium/Low
- Description: What is the specific concern?
- Evidence: Quote from source documents
- Confidence: 0-100

COMMON RED FLAGS TO LOOK FOR:
- Lack of urgency or timeline slipping
- Economic buyer not engaged
- No champion identified
- Strong competitor presence
- Budget concerns or hesitation
- Multiple decision makers not aligned
- Technical concerns unresolved
- "We'll think about it" language

OUTPUT FORMAT (JSON only, no other text):
{
  "red_flags": [
    {
      "severity": "High",
      "description": "Economic buyer not participating in recent calls",
      "evidence": "Last 3 transcripts show only technical stakeholders present",
      "confidence": 90
    }
  ]
}`;
}

/**
 * Generate Next Actions prompt
 */
function getNextActionsPrompt(context: AnalysisContext, meddpiccSummary: string): string {
  const recentDocs = context.documents.slice(-2);
  const recentActivity = recentDocs
    .map(doc => `${doc.fileName}: ${doc.fileContent.slice(0, 500)}...`)
    .join('\n\n');

  return `You are a sales strategist recommending next steps.

CONTEXT:
Account: ${context.accountName}
Opportunity: ${context.opportunityName}
Current Stage: ${context.currentStage}

CURRENT SITUATION:
MEDDPICC/BANT Status: ${meddpiccSummary}

Recent Activity:
${recentActivity}

TASK:
Recommend 3-5 prioritized next actions to advance this deal. For each:
- Priority: 1-5 (1 = most urgent)
- Action: Specific, actionable task
- Rationale: Why this action matters now
- Confidence: 0-100

Focus on:
- Filling MEDDPICC/BANT gaps
- Engaging missing stakeholders
- Addressing identified risks
- Advancing the deal stage

OUTPUT FORMAT (JSON only, no other text):
{
  "actions": [
    {
      "priority": 1,
      "action": "Schedule call with CFO to confirm Q4 budget allocation",
      "rationale": "Economic buyer engagement is critical; only spoke with VP-level so far",
      "confidence": 85
    }
  ]
}`;
}

/**
 * Parse JSON from AI response, handling potential markdown code blocks
 */
function parseAIJSON(response: string): any {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try to extract from markdown code block
    const match = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    // Try to find any JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON from AI response');
  }
}

/**
 * Analyze opportunity using Gemini 2.0 Flash for MEDDPICC/BANT
 */
async function analyzeMEDDPICCWithGemini(context: AnalysisContext): Promise<{ meddpicc: MEDDPICCResponse; bant: BANTResponse }> {
  const model = googleAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp' });
  const prompt = getMEDDPICCPrompt(context);

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const parsed = parseAIJSON(response);
  return {
    meddpicc: parsed.meddpicc,
    bant: parsed.bant,
  };
}

/**
 * Identify red flags using GPT-4o
 */
async function analyzeRedFlagsWithOpenAI(context: AnalysisContext): Promise<RedFlag[]> {
  const prompt = getRedFlagsPrompt(context);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const response = completion.choices[0].message.content || '{}';
  const parsed = parseAIJSON(response);
  return parsed.red_flags || [];
}

/**
 * Generate next actions using Claude Sonnet
 */
async function analyzeNextActionsWithClaude(context: AnalysisContext, meddpiccSummary: string): Promise<NextAction[]> {
  const prompt = getNextActionsPrompt(context, meddpiccSummary);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const response = (message.content[0] as any).text || '{}';
  const parsed = parseAIJSON(response);
  return parsed.actions || [];
}

/**
 * Main analysis function - orchestrates all AI calls
 */
export async function analyzeOpportunity(context: AnalysisContext): Promise<AIAnalysisResult> {
  try {
    // Run analyses in parallel where possible
    const [meddpiccBant, redFlags] = await Promise.all([
      analyzeMEDDPICCWithGemini(context),
      analyzeRedFlagsWithOpenAI(context),
    ]);

    // Create MEDDPICC summary for next actions
    const meddpiccSummary = `
Metrics: ${meddpiccBant.meddpicc.metrics.confidence}% confidence
Economic Buyer: ${meddpiccBant.meddpicc.economicBuyer.confidence}% confidence
Decision Criteria: ${meddpiccBant.meddpicc.decisionCriteria.confidence}% confidence
Decision Process: ${meddpiccBant.meddpicc.decisionProcess.confidence}% confidence
Pain: ${meddpiccBant.meddpicc.pain.confidence}% confidence
Champion: ${meddpiccBant.meddpicc.champion.confidence}% confidence
Competition: ${meddpiccBant.meddpicc.competition.confidence}% confidence

Budget: ${meddpiccBant.bant.budget.confidence}% confidence
Authority: ${meddpiccBant.bant.authority.confidence}% confidence
Need: ${meddpiccBant.bant.need.confidence}% confidence
Timeline: ${meddpiccBant.bant.timeline.confidence}% confidence
    `.trim();

    // Generate next actions
    const nextActions = await analyzeNextActionsWithClaude(context, meddpiccSummary);

    return {
      meddpicc: meddpiccBant.meddpicc,
      bant: meddpiccBant.bant,
      redFlags,
      nextActions,
      // Placeholder for additional insights
      stakeholderGaps: 'Analysis in progress',
      stakeholderGapsConfidence: 50,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
}
