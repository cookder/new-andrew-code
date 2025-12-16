import type { Industry } from '../types';

export interface Advantage {
  title: string;
  description: string;
  talkingPoint: string;
}

export interface ObjectionHandler {
  objection: string;
  response: string;
}

export interface CompetitiveData {
  whyCustomersLeave: string[];
  discoveryQuestions: string[];
  keyAdvantages: Advantage[];
  objectionHandlers: ObjectionHandler[];
}

export const oneDriveDisplacement: CompetitiveData = {
  whyCustomersLeave: [
    'Sync issues and version conflicts causing lost work',
    'Complex permissions model requiring constant IT intervention',
    "Poor external collaboration — guests can't navigate SharePoint",
    'Security gaps — no native classification or watermarking',
    'Hidden costs — CALs, Azure storage overages, admin overhead',
    'Lack of dedicated support — tickets go to generic Microsoft queue',
    'Fragmented experience across OneDrive, SharePoint, Teams files',
  ],

  discoveryQuestions: [
    'How much time does your IT team spend on file sync support tickets each week?',
    'What happens when you need to share files with external contractors or clients?',
    'How confident are you in your ability to locate and secure sensitive data across SharePoint sites?',
    "What's your process for ensuring departed employees don't retain access to files?",
    'How do you handle large file transfers that exceed email attachment limits?',
    'What does your audit trail look like for compliance purposes?',
    "When's the last time you had a version conflict issue? What did it cost you?",
    'How many SharePoint sites do you have? Who manages permissions for each?',
  ],

  keyAdvantages: [
    {
      title: 'Single Content Layer',
      description: 'One place for all files vs. fragmented OneDrive + SharePoint + Teams',
      talkingPoint: "Your users shouldn't need to think about where to save files.",
    },
    {
      title: 'Native Security',
      description: 'Classification, watermarking, granular access controls built-in',
      talkingPoint: 'Box Shield can automatically detect and protect sensitive content.',
    },
    {
      title: 'External Collaboration',
      description: 'Seamless experience for guests — no Microsoft account required',
      talkingPoint: 'Your clients and contractors get a simple, professional experience.',
    },
    {
      title: '1,500+ Integrations',
      description: 'Including all Microsoft apps — Outlook, Teams, Office Online',
      talkingPoint: 'You keep using the Microsoft tools you love, with better content management.',
    },
    {
      title: 'Dedicated Support',
      description: 'Named CSM, Box Support team, not generic Microsoft ticket queue',
      talkingPoint: 'When you have an issue, you talk to someone who knows your account.',
    },
    {
      title: 'Predictable Pricing',
      description: 'Simple per-user pricing, unlimited storage on Enterprise tiers',
      talkingPoint: 'No surprise Azure storage bills or complex CAL calculations.',
    },
  ],

  objectionHandlers: [
    {
      objection: 'We already pay for OneDrive with M365',
      response: "Totally understand — most of our customers have M365 too. The question is whether you're getting value from OneDrive or just paying for it. When we look at the IT overhead for managing sync issues, the security gaps you're filling with other tools, and the productivity loss from poor external collaboration, the 'free' storage often costs more than a purpose-built solution. Let me show you how [similar customer] quantified this.",
    },
    {
      objection: 'Migration seems risky',
      response: "That's the right concern to have — we take migration seriously. Box has migrated over 100,000 organizations, many from SharePoint specifically. We have dedicated migration tools and a consulting team that handles the heavy lifting. Most customers are surprised how smooth it is. Would it help to talk to [reference customer] about their migration experience?",
    },
    {
      objection: 'Our IT team knows Microsoft',
      response: "That expertise is valuable and you'll keep using it — Box integrates deeply with your Microsoft stack. What we hear from IT teams is that Box actually frees them up from the content management headaches so they can focus on higher-value work. The admin console is dramatically simpler than SharePoint admin center.",
    },
    {
      objection: 'SharePoint works fine for us',
      response: "I appreciate that perspective. Can I ask — when you say it works fine, are you comparing it to your actual needs or just to what you've gotten used to? A lot of our customers said the same thing until they saw what 'good' looks like. What if I showed you a quick demo focused specifically on [their pain point] and you can judge for yourself?",
    },
  ],
};

export interface VerticalUseCase {
  useCases: string[];
  talkingPoints: string[];
}

export const boxAIByVertical: Record<Industry, VerticalUseCase> = {
  construction: {
    useCases: [
      'Instantly answer questions about specs, submittals, and RFIs across projects',
      'Generate meeting summaries from project documentation',
      'Extract key dates and deliverables from contracts',
      'Compare specs across document versions',
    ],
    talkingPoints: [
      "Your PMs can ask 'What's the concrete spec for Building B?' and get an instant answer",
      'No more digging through 500-page specs to find one detail',
    ],
  },
  legal: {
    useCases: [
      'Summarize contracts and highlight key terms',
      'Compare agreement versions to identify changes',
      'Extract obligations, deadlines, and party information',
      'Research across matter files with natural language queries',
    ],
    talkingPoints: [
      'Associates spend hours on doc review that AI can do in seconds',
      'Partners can ask questions about case history without waiting for associate research',
    ],
  },
  healthcare: {
    useCases: [
      'Query across patient documentation for care coordination',
      'Summarize clinical notes and reports',
      'Extract key information from intake forms',
      'Research across policy and procedure documents',
    ],
    talkingPoints: [
      'Care coordinators can find information without flipping through charts',
      "Maintains HIPAA compliance with Box's security model",
    ],
  },
  financial_services: {
    useCases: [
      'Analyze client portfolios and statements',
      'Extract data from financial reports',
      'Summarize investment committee materials',
      'Research across compliance documentation',
    ],
    talkingPoints: [
      'Advisors can prep for client meetings in minutes instead of hours',
      'AI works within your existing security and compliance perimeter',
    ],
  },
  manufacturing: {
    useCases: [
      'Search across product specifications and manuals',
      'Extract quality control data from reports',
      'Summarize supplier documentation',
      'Query safety and compliance records',
    ],
    talkingPoints: [
      'Engineers can find specifications instantly across thousands of documents',
      'Quality teams get faster access to compliance information',
    ],
  },
  professional_services: {
    useCases: [
      'Research across client engagement files',
      'Summarize project deliverables and status',
      'Extract key metrics from reports',
      'Answer questions across knowledge bases',
    ],
    talkingPoints: [
      'Consultants can quickly get up to speed on client history',
      'Leverage institutional knowledge without tribal expertise',
    ],
  },
  other: {
    useCases: [
      'Search and summarize documents with natural language',
      'Extract key information from files',
      'Generate summaries and insights',
      'Answer questions across your content',
    ],
    talkingPoints: [
      'Turn your document repository into an intelligent knowledge base',
      'Get answers in seconds instead of hours of searching',
    ],
  },
};

export const discoveryQuestions = {
  general: [
    "What's your biggest challenge with content management today?",
    'How do you currently share files with external partners?',
    'Walk me through what happens when an employee leaves',
    "What's your process for ensuring sensitive data is protected?",
    'How do you handle compliance and audit requirements?',
  ],
  security: [
    'Have you had any data breach incidents in the past year?',
    'How do you classify and protect sensitive content?',
    'What happens when files leave your organization?',
    "Who can see your company's most sensitive documents?",
  ],
  collaboration: [
    'How many external users do you work with?',
    'What tools do external partners need to install to work with you?',
    "What's the feedback from external parties on collaboration?",
    'How do you handle large file transfers?',
  ],
  efficiency: [
    'How much time do users spend looking for files?',
    'What happens when there are version conflicts?',
    'How many support tickets are file-related?',
    'How many different places do users need to look for content?',
  ],
};
