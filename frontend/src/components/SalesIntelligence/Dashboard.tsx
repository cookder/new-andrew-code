'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileText,
  Filter,
  Mail,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

type Stage =
  | 'Discovery'
  | 'Demo'
  | 'Validating Business Case'
  | 'Negotiating $'
  | 'Finalizing Closure'
  | 'Closed Won'
  | 'Closed Lost';

type DocumentType = 'Transcript' | 'Email Thread' | 'Other';

interface StageHistoryItem {
  stage: Stage;
  changedAt: string;
}

interface DocumentRecord {
  id: string;
  type: DocumentType;
  fileName: string;
  uploadedAt: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Error';
  contentPreview: string;
}

interface FrameworkField {
  label: string;
  value: string;
  confidence: number;
  sources?: string[];
  contact?: string;
  lastUpdated: string;
}

interface FrameworkData {
  meddpicc: Record<
    | 'metrics'
    | 'economicBuyer'
    | 'decisionCriteria'
    | 'decisionProcess'
    | 'identifyPain'
    | 'champion'
    | 'competition',
    FrameworkField
  >;
  bant: Record<'budget' | 'authority' | 'need' | 'timeline', FrameworkField>;
  completion: {
    meddpicc: number;
    bant: number;
  };
}

interface InsightData {
  redFlags: Array<{
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    evidence: string;
    confidence: number;
  }>;
  actions: Array<{
    priority: number;
    action: string;
    rationale: string;
    confidence: number;
  }>;
  stakeholderGaps: string;
  budgetSignals: string;
  stageRecommendation?: {
    stage: Stage;
    rationale: string;
    confidence: number;
  };
}

interface ContactRecord {
  name: string;
  title: string;
  email: string;
  phone?: string;
  stakeholderType:
    | 'Economic Buyer'
    | 'Technical Buyer'
    | 'Champion'
    | 'Influencer'
    | 'End User'
    | 'Unknown';
}

interface Opportunity {
  id: string;
  name: string;
  account: string;
  industry: string;
  companySize: number;
  website: string;
  amount: number;
  expectedClose: string;
  stage: Stage;
  healthScore: number;
  lastUpdated: string;
  lastAnalyzed: string;
  stageHistory: StageHistoryItem[];
  documents: DocumentRecord[];
  framework: FrameworkData;
  insights: InsightData;
  contacts: ContactRecord[];
}

const stagePalette: Record<Stage, string> = {
  Discovery: 'bg-blue-100 text-blue-800 border-blue-200',
  Demo: 'bg-purple-100 text-purple-800 border-purple-200',
  'Validating Business Case': 'bg-amber-100 text-amber-800 border-amber-200',
  'Negotiating $': 'bg-pink-100 text-pink-800 border-pink-200',
  'Finalizing Closure': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Closed Won': 'bg-green-100 text-green-800 border-green-200',
  'Closed Lost': 'bg-gray-100 text-gray-800 border-gray-200',
};

const sampleOpportunities: Opportunity[] = [
  {
    id: 'op-001',
    name: 'Northwind ERP Modernization',
    account: 'Northwind Traders',
    industry: 'Manufacturing',
    companySize: 850,
    website: 'northwindtraders.com',
    amount: 280000,
    expectedClose: '2024-12-15',
    stage: 'Demo',
    healthScore: 72,
    lastUpdated: '2024-08-05',
    lastAnalyzed: '2024-08-05T13:30:00Z',
    stageHistory: [
      { stage: 'Discovery', changedAt: '2024-07-02' },
      { stage: 'Demo', changedAt: '2024-07-18' },
    ],
    documents: [
      {
        id: 'doc-1',
        type: 'Transcript',
        fileName: 'discovery_call_july2.txt',
        uploadedAt: '2024-07-02T15:30:00Z',
        status: 'Completed',
        contentPreview:
          'Discussed pain around legacy ERP reporting delays and manual reconciliations... ',
      },
      {
        id: 'doc-2',
        type: 'Email Thread',
        fileName: 'roi_followup.pdf',
        uploadedAt: '2024-07-25T10:05:00Z',
        status: 'Completed',
        contentPreview: 'CFO asked for ROI model and requested TCO comparison vs incumbent...',
      },
      {
        id: 'doc-3',
        type: 'Transcript',
        fileName: 'technical_deep_dive.txt',
        uploadedAt: '2024-08-01T17:45:00Z',
        status: 'Completed',
        contentPreview: 'CTO raised concerns about data migration cutover risk and downtime...',
      },
    ],
    framework: {
      meddpicc: {
        metrics: {
          label: 'Metrics',
          value: 'Reduce monthly close time by 3 days; cut manual journal entries by 40%.',
          confidence: 86,
          sources: ['discovery_call_july2.txt (lines 42-60)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        economicBuyer: {
          label: 'Economic Buyer',
          value: 'Karen Holt, CFO, wants ROI model before advancing.',
          confidence: 74,
          contact: 'Karen Holt',
          sources: ['roi_followup.pdf (page 2)'],
          lastUpdated: '2024-07-25T10:05:00Z',
        },
        decisionCriteria: {
          label: 'Decision Criteria',
          value: 'Faster reporting, prebuilt manufacturing KPIs, SOC 2 compliance, and low migration risk.',
          confidence: 79,
          sources: ['technical_deep_dive.txt (lines 12-33)'],
          lastUpdated: '2024-08-01T17:45:00Z',
        },
        decisionProcess: {
          label: 'Decision Process',
          value: 'CTO to complete technical evaluation by Aug 20; CFO signs off after ROI review.',
          confidence: 71,
          sources: ['roi_followup.pdf (page 3)', 'technical_deep_dive.txt (lines 55-70)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        identifyPain: {
          label: 'Identify Pain',
          value:
            'Legacy ERP requires manual reconciliations; finance team spending 25 hours/week fixing data mismatches.',
          confidence: 88,
          sources: ['discovery_call_july2.txt (lines 10-25)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        champion: {
          label: 'Champion',
          value: 'Operations VP (Miguel Santos) is pushing for modern analytics and smoother shop-floor reporting.',
          confidence: 81,
          contact: 'Miguel Santos',
          sources: ['discovery_call_july2.txt (lines 64-75)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        competition: {
          label: 'Competition',
          value: 'Evaluating NetSuite add-ons and incumbent VAR proposal; no formal bake-off scheduled.',
          confidence: 63,
          sources: ['roi_followup.pdf (page 4)'],
          lastUpdated: '2024-08-01T17:45:00Z',
        },
      },
      bant: {
        budget: {
          label: 'Budget',
          value: 'Targeting $250k-$300k capital with CFO approval pending ROI validation.',
          confidence: 70,
          sources: ['roi_followup.pdf (page 2)'],
          lastUpdated: '2024-07-25T10:05:00Z',
        },
        authority: {
          label: 'Authority',
          value: 'CFO and CTO are final signers; Ops VP influencing evaluation.',
          confidence: 78,
          sources: ['technical_deep_dive.txt (lines 60-72)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        need: {
          label: 'Need',
          value: 'Need automated reconciliations and consolidated manufacturing KPIs for monthly board reporting.',
          confidence: 84,
          sources: ['discovery_call_july2.txt (lines 18-44)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
        timeline: {
          label: 'Timeline',
          value: 'Technical decision by Aug 20; budget finalized early September; go-live Q4.',
          confidence: 68,
          sources: ['technical_deep_dive.txt (lines 70-82)'],
          lastUpdated: '2024-08-05T13:30:00Z',
        },
      },
      completion: {
        meddpicc: 71,
        bant: 75,
      },
    },
    insights: {
      redFlags: [
        {
          severity: 'High',
          description: 'Economic buyer has not joined the last two calls; ROI model still pending review.',
          evidence: 'roi_followup.pdf shows CFO requested ROI before advancing.',
          confidence: 88,
        },
        {
          severity: 'Medium',
          description: 'Migration risk concerns surfaced without mitigation plan presented.',
          evidence: 'technical_deep_dive.txt includes questions on downtime and data quality.',
          confidence: 76,
        },
      ],
      actions: [
        {
          priority: 1,
          action: 'Schedule CFO review of ROI model and confirm Q4 budget window.',
          rationale: 'Unblocks economic buyer sign-off and secures funding guardrails.',
          confidence: 92,
        },
        {
          priority: 2,
          action: 'Share migration playbook with CTO including cutover rehearsal and rollback.',
          rationale: 'Addresses perceived implementation risk and keeps evaluation on track.',
          confidence: 86,
        },
        {
          priority: 3,
          action: 'Introduce customer reference in manufacturing to reinforce champion narrative.',
          rationale: 'Strengthens Ops VP advocacy and mitigates competitor influence.',
          confidence: 74,
        },
      ],
      stakeholderGaps: 'Economic buyer engagement is light; need security lead for SOC 2 confirmation.',
      budgetSignals: 'Budget contingent on ROI approval; CFO prefers capital expense in Q4.',
      stageRecommendation: {
        stage: 'Validating Business Case',
        rationale: 'MEDDPICC 71% complete and finance needs ROI validation before commercial terms.',
        confidence: 85,
      },
    },
    contacts: [
      {
        name: 'Karen Holt',
        title: 'Chief Financial Officer',
        email: 'karen.holt@northwindtraders.com',
        phone: '+1 (415) 555-4100',
        stakeholderType: 'Economic Buyer',
      },
      {
        name: 'Miguel Santos',
        title: 'VP of Operations',
        email: 'miguel.santos@northwindtraders.com',
        phone: '+1 (415) 555-4200',
        stakeholderType: 'Champion',
      },
      {
        name: 'Priya Patel',
        title: 'CTO',
        email: 'priya.patel@northwindtraders.com',
        phone: '+1 (415) 555-4300',
        stakeholderType: 'Technical Buyer',
      },
    ],
  },
  {
    id: 'op-002',
    name: 'Apex Data Cloud Renewal',
    account: 'Apex Labs',
    industry: 'Biotech',
    companySize: 2200,
    website: 'apexlabs.io',
    amount: 450000,
    expectedClose: '2024-09-30',
    stage: 'Validating Business Case',
    healthScore: 81,
    lastUpdated: '2024-08-03',
    lastAnalyzed: '2024-08-03T16:15:00Z',
    stageHistory: [
      { stage: 'Discovery', changedAt: '2024-06-10' },
      { stage: 'Demo', changedAt: '2024-06-25' },
      { stage: 'Validating Business Case', changedAt: '2024-07-12' },
    ],
    documents: [
      {
        id: 'doc-4',
        type: 'Email Thread',
        fileName: 'security_review.pdf',
        uploadedAt: '2024-07-18T09:12:00Z',
        status: 'Completed',
        contentPreview: 'Security team completed review; SOC 2 Type II accepted; waiting on DPA edits...',
      },
      {
        id: 'doc-5',
        type: 'Transcript',
        fileName: 'exec_alignment.txt',
        uploadedAt: '2024-07-30T14:50:00Z',
        status: 'Completed',
        contentPreview:
          'CEO emphasized speed to science; prefers partners who can accelerate data onboarding within 45 days...',
      },
    ],
    framework: {
      meddpicc: {
        metrics: {
          label: 'Metrics',
          value: 'Accelerate trial data onboarding from 6 weeks to 3; reduce compliance review effort by 30%.',
          confidence: 90,
          sources: ['exec_alignment.txt (lines 20-48)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        economicBuyer: {
          label: 'Economic Buyer',
          value: 'COO (Lena Cho) owns renewal and expansion budget.',
          confidence: 83,
          contact: 'Lena Cho',
          sources: ['exec_alignment.txt (lines 8-15)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        decisionCriteria: {
          label: 'Decision Criteria',
          value: 'Time-to-value within 45 days, validated security posture, analytics flexibility for clinical ops.',
          confidence: 82,
          sources: ['security_review.pdf (page 3)', 'exec_alignment.txt (lines 30-44)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        decisionProcess: {
          label: 'Decision Process',
          value: 'Security sign-off completed; COO to finalize commercials after legal redlines by Aug 15.',
          confidence: 85,
          sources: ['security_review.pdf (page 4)'],
          lastUpdated: '2024-08-03T16:15:00Z',
        },
        identifyPain: {
          label: 'Identify Pain',
          value:
            'Scientists blocked by slow data onboarding; legal wants faster DPA turns; compliance team overworked.',
          confidence: 88,
          sources: ['exec_alignment.txt (lines 30-52)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        champion: {
          label: 'Champion',
          value: 'Head of Clinical Ops (Samir Nair) actively driving expansion.',
          confidence: 86,
          contact: 'Samir Nair',
          sources: ['exec_alignment.txt (lines 10-18)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        competition: {
          label: 'Competition',
          value: 'Considering in-house build for analytics; minor mention of Snowflake reseller.',
          confidence: 58,
          sources: ['exec_alignment.txt (lines 55-63)'],
          lastUpdated: '2024-08-03T16:15:00Z',
        },
      },
      bant: {
        budget: {
          label: 'Budget',
          value: 'Renewal + 25% expansion budget pre-approved by COO pending legal close.',
          confidence: 88,
          sources: ['exec_alignment.txt (lines 12-20)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        authority: {
          label: 'Authority',
          value: 'COO final signer; Legal and Security advisory; Head of Clinical Ops influencing.',
          confidence: 90,
          sources: ['security_review.pdf (page 2)'],
          lastUpdated: '2024-08-03T16:15:00Z',
        },
        need: {
          label: 'Need',
          value: 'Need accelerated trial onboarding and more self-serve analytics for clinical teams.',
          confidence: 87,
          sources: ['exec_alignment.txt (lines 24-40)'],
          lastUpdated: '2024-07-30T14:50:00Z',
        },
        timeline: {
          label: 'Timeline',
          value: 'Commercials to finalize by Aug 20 to hit September renewal date.',
          confidence: 82,
          sources: ['security_review.pdf (page 4)'],
          lastUpdated: '2024-08-03T16:15:00Z',
        },
      },
      completion: {
        meddpicc: 86,
        bant: 87,
      },
    },
    insights: {
      redFlags: [
        {
          severity: 'Low',
          description: 'Mild interest in in-house build could slow expansion scope.',
          evidence: 'exec_alignment.txt mentions Snowflake reseller and DIY analytics.',
          confidence: 55,
        },
      ],
      actions: [
        {
          priority: 1,
          action: 'Deliver DPA redline responses before Aug 12 to keep renewal timeline intact.',
          rationale: 'Legal turnaround is the pacing item for commercials.',
          confidence: 90,
        },
        {
          priority: 2,
          action: 'Share 45-day onboarding plan aligned to COO success metrics.',
          rationale: 'Directly supports metric commitments and reduces risk of DIY build.',
          confidence: 85,
        },
      ],
      stakeholderGaps: 'Need data governance lead identified to approve retention controls.',
      budgetSignals: 'Budget allocated; expansion contingent on finalized legal docs.',
    },
    contacts: [
      {
        name: 'Lena Cho',
        title: 'COO',
        email: 'lena.cho@apexlabs.io',
        stakeholderType: 'Economic Buyer',
      },
      {
        name: 'Samir Nair',
        title: 'Head of Clinical Operations',
        email: 'samir.nair@apexlabs.io',
        stakeholderType: 'Champion',
      },
      {
        name: 'Alicia Reyes',
        title: 'Security Lead',
        email: 'alicia.reyes@apexlabs.io',
        stakeholderType: 'Technical Buyer',
      },
    ],
  },
];

const stages: Stage[] = [
  'Discovery',
  'Demo',
  'Validating Business Case',
  'Negotiating $',
  'Finalizing Closure',
  'Closed Won',
  'Closed Lost',
];

function confidenceColor(score: number) {
  if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function healthColor(score: number) {
  if (score >= 75) return 'text-green-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-red-700';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SalesIntelligenceDashboard() {
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [healthFloor, setHealthFloor] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>(sampleOpportunities[0].id);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return sampleOpportunities.filter((opp) => {
      const matchesStage = stageFilter === 'All' || opp.stage === stageFilter;
      const matchesHealth = opp.healthScore >= healthFloor;
      const matchesSearch = `${opp.name} ${opp.account}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesStage && matchesHealth && matchesSearch;
    });
  }, [stageFilter, healthFloor, search]);

  const selectedOpportunity =
    filtered.find((opp) => opp.id === selectedId) || filtered[0] || sampleOpportunities[0];

  const daysInStage = differenceInCalendarDays(
    new Date(),
    new Date(selectedOpportunity.stageHistory[selectedOpportunity.stageHistory.length - 1].changedAt),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">AI-Powered Sales Intelligence</p>
            <h1 className="text-3xl font-semibold text-slate-900">Opportunity Control Center</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Track MEDDPICC/BANT coverage, document-driven insights, and AI recommendations across
              active deals.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Create New Opportunity
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<Activity className="h-5 w-5 text-blue-600" />}
            label="Active Opportunities"
            value={sampleOpportunities.length}
            helper="Filter by stage and health"
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5 text-emerald-600" />}
            label="Avg. Health Score"
            value={`${Math.round(
              sampleOpportunities.reduce((acc, opp) => acc + opp.healthScore, 0) /
                sampleOpportunities.length,
            )}%`}
            helper="Weighted by AI completeness"
          />
          <SummaryCard
            icon={<FileText className="h-5 w-5 text-indigo-600" />}
            label="Documents Ingested"
            value={sampleOpportunities.reduce((acc, opp) => acc + opp.documents.length, 0)}
            helper="Triggers full re-analysis"
          />
        </section>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-100">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <Filter className="h-4 w-4" /> Filters
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search opportunities or accounts"
                  className="bg-transparent text-sm focus:outline-none"
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                <option value="All">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>Min Health</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={healthFloor}
                  onChange={(e) => setHealthFloor(Number(e.target.value))}
                />
                <span className="font-semibold">{healthFloor}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="h-2 w-2 rounded-full bg-green-500" /> Healthy
              <div className="h-2 w-2 rounded-full bg-amber-500" /> Watch
              <div className="h-2 w-2 rounded-full bg-red-500" /> At Risk
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 md:grid-cols-2">
            {filtered.map((opp) => (
              <button
                key={opp.id}
                onClick={() => setSelectedId(opp.id)}
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white ${
                  opp.id === selectedOpportunity.id ? 'border-slate-400 bg-white shadow-sm' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{opp.account}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{opp.name}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stagePalette[opp.stage]}`}>
                    {opp.stage}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>{formatCurrency(opp.amount)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs">
                    <CalendarClock className="h-4 w-4 text-slate-500" />
                    Close {format(new Date(opp.expectedClose), 'MMM d, yyyy')}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs ${healthColor(opp.healthScore)}`}>
                    <Activity className="h-4 w-4" /> {opp.healthScore}% Health
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{opp.framework.completion.meddpicc}% MEDDPICC</span>
                  <span>{opp.framework.completion.bant}% BANT</span>
                  <span>{opp.documents.length} docs</span>
                  <span>Updated {format(new Date(opp.lastUpdated), 'MMM d')}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="px-6 py-4">
            <OpportunityDetail opportunity={selectedOpportunity} daysInStage={daysInStage} />
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function OpportunityDetail({ opportunity, daysInStage }: { opportunity: Opportunity; daysInStage: number }) {
  const [tab, setTab] = useState<'overview' | 'framework' | 'insights' | 'documents' | 'contacts'>('overview');

  const tabButton = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  const meddpiccEntries = Object.values(opportunity.framework.meddpicc);
  const bantEntries = Object.values(opportunity.framework.bant);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{opportunity.account}</p>
          <h2 className="text-2xl font-semibold text-slate-900">{opportunity.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>{opportunity.industry}</span>
            <span>•</span>
            <span>{opportunity.companySize.toLocaleString()} employees</span>
            <span>•</span>
            <span className="underline underline-offset-2">{opportunity.website}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stagePalette[opportunity.stage]}`}>
            {opportunity.stage}
          </span>
          <span className={`rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold ${healthColor(opportunity.healthScore)}`}>
            Health {opportunity.healthScore}%
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            Last analyzed {format(new Date(opportunity.lastAnalyzed), 'MMM d, p')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabButton('overview', 'Overview')}
        {tabButton('framework', 'MEDDPICC / BANT')}
        {tabButton('insights', 'AI Insights')}
        {tabButton('documents', 'Documents')}
        {tabButton('contacts', 'Contacts & Account')}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">Deal Amount</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(opportunity.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Expected Close</p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(new Date(opportunity.expectedClose), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Overall Health</span>
                <span className={`font-semibold ${healthColor(opportunity.healthScore)}`}>
                  {opportunity.healthScore}%
                </span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${
                    opportunity.healthScore >= 75
                      ? 'bg-green-500'
                      : opportunity.healthScore >= 50
                        ? 'bg-amber-400'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${opportunity.healthScore}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Health blends MEDDPICC (60%), BANT (30%), and red flag penalties.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatPill label="Documents" value={`${opportunity.documents.length}`} icon={<FileText className="h-4 w-4" />} />
              <StatPill
                label="Stakeholders"
                value={`${opportunity.contacts.length}`}
                icon={<Users className="h-4 w-4" />}
              />
              <StatPill label="Days in Stage" value={`${daysInStage}`} icon={<CalendarClock className="h-4 w-4" />} />
              <StatPill
                label="Stage History"
                value={`${opportunity.stageHistory.length} updates`}
                icon={<Activity className="h-4 w-4" />}
              />
            </div>

            {opportunity.insights.stageRecommendation && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">AI Stage Recommendation</p>
                </div>
                <p className="mt-2 text-sm text-amber-900">
                  Move to <span className="font-semibold">{opportunity.insights.stageRecommendation.stage}</span> —
                  {` ${opportunity.insights.stageRecommendation.rationale}`}
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Confidence {opportunity.insights.stageRecommendation.confidence}%
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">MEDDPICC & BANT Completion</h3>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div>
                <p className="text-sm text-slate-600">MEDDPICC</p>
                <p className="text-2xl font-semibold text-slate-900">{opportunity.framework.completion.meddpicc}%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div>
                <p className="text-sm text-slate-600">BANT</p>
                <p className="text-2xl font-semibold text-slate-900">{opportunity.framework.completion.bant}%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              Full re-analysis runs whenever transcripts or email threads are added to the opportunity.
            </div>
          </div>
        </div>
      )}

      {tab === 'framework' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">MEDDPICC</h3>
              <span className="text-xs text-slate-500">Confidence-weighted</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {meddpiccEntries.map((field) => (
                <FrameworkCard key={field.label} field={field} />
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">BANT</h3>
              <span className="text-xs text-slate-500">Confidence-weighted</span>
            </div>
            <div className="space-y-3">
              {bantEntries.map((field) => (
                <FrameworkCard key={field.label} field={field} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'insights' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Red Flags / Risks</h3>
            </div>
            {opportunity.insights.redFlags.map((flag, idx) => (
              <div key={idx} className="rounded-lg border border-red-100 bg-red-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-red-800">{flag.severity} severity</span>
                  <span className="text-red-700">Confidence {flag.confidence}%</span>
                </div>
                <p className="mt-1 text-sm text-red-900">{flag.description}</p>
                <p className="mt-1 text-xs text-red-800">Evidence: {flag.evidence}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Next Best Actions</h3>
            </div>
            {opportunity.insights.actions.map((action, idx) => (
              <div key={idx} className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-emerald-900">Priority {action.priority}</span>
                  <span className="text-emerald-700">Confidence {action.confidence}%</span>
                </div>
                <p className="mt-1 text-sm text-emerald-900">{action.action}</p>
                <p className="mt-1 text-xs text-emerald-800">{action.rationale}</p>
              </div>
            ))}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Stakeholder Gaps</p>
              <p className="mt-1 text-slate-700">{opportunity.insights.stakeholderGaps}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Budget & Timeline Signals</p>
              <p className="mt-1 text-slate-700">{opportunity.insights.budgetSignals}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Documents</h3>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white">
              <Plus className="h-4 w-4" /> Upload TXT or PDF
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {opportunity.documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.fileName}</p>
                    <p className="text-xs text-slate-600">{doc.type}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(doc.uploadedAt), 'MMM d, yyyy p')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{doc.contentPreview}</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                    doc.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : doc.status === 'Processing'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : doc.status === 'Pending'
                          ? 'border-slate-200 bg-slate-50 text-slate-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Contacts & Account</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {opportunity.contacts.map((contact) => (
              <div key={contact.email} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                    <p className="text-xs text-slate-600">{contact.title}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    {contact.stakeholderType}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 text-slate-500" /> {contact.email}
                </div>
                {contact.phone && (
                  <div className="mt-1 text-sm text-slate-700">{contact.phone}</div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Account Notes</p>
            <p className="mt-1">
              Keep stakeholder map current to strengthen multi-threading and align MEDDPICC/BANT coverage. Update
              website, industry, and company size for accurate context in prompts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FrameworkCard({ field }: { field: FrameworkField }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{field.label}</p>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${confidenceColor(field.confidence)}`}>
          {field.confidence}%
        </span>
      </div>
      <p className="text-sm text-slate-700">{field.value}</p>
      {field.contact && <p className="text-xs text-slate-600">Stakeholder: {field.contact}</p>}
      {field.sources && <p className="text-xs text-slate-500">Sources: {field.sources.join(', ')}</p>}
      <p className="text-xs text-slate-500">Updated {format(new Date(field.lastUpdated), 'MMM d, yyyy')}</p>
    </div>
  );
}

function StatPill({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
