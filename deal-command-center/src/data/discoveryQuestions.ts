import type { Industry, Stage } from '../types';

export interface QuestionCategory {
  category: string;
  questions: string[];
}

export const discoveryQuestionsByStage: Record<Stage, QuestionCategory[]> = {
  discovery: [
    {
      category: 'Current State',
      questions: [
        "What's driving your interest in looking at content management solutions right now?",
        'Walk me through how your team currently stores and shares files',
        'What tools are you using today and what do you like/dislike about them?',
        'How many people need access to your content?',
      ],
    },
    {
      category: 'Pain Points',
      questions: [
        "What's the biggest challenge you're facing with your current setup?",
        'When was the last time a file issue caused a real problem? What happened?',
        "If you could wave a magic wand and fix one thing, what would it be?",
      ],
    },
    {
      category: 'Business Impact',
      questions: [
        'How does this challenge affect your team productivity?',
        'What does this problem cost you in time, money, or risk?',
        'Who else in the organization is affected by these issues?',
      ],
    },
  ],
  qualification: [
    {
      category: 'Decision Process',
      questions: [
        'Besides yourself, who else needs to be involved in this decision?',
        "What's your typical process for evaluating new software?",
        'Have you set aside budget for solving this problem?',
        "What's your timeline for making a decision?",
      ],
    },
    {
      category: 'Requirements',
      questions: [
        'What are the must-have features for any solution you choose?',
        'What integrations are critical for your workflow?',
        'What security or compliance requirements do you need to meet?',
        "What's your expected user count?",
      ],
    },
    {
      category: 'Competition',
      questions: [
        'Are you looking at any other solutions?',
        'What would make you choose one solution over another?',
        'Have you tried to solve this problem before? What happened?',
      ],
    },
  ],
  demo: [
    {
      category: 'Demo Prep',
      questions: [
        'What specific workflows should I focus on in the demo?',
        'Who will be attending and what are their priorities?',
        'What would make this demo a success from your perspective?',
        'Are there any concerns I should address proactively?',
      ],
    },
  ],
  proposal: [
    {
      category: 'Proposal Refinement',
      questions: [
        'What questions do you anticipate from your team about the proposal?',
        'Is there anything in the proposal that concerns you?',
        'What would make this proposal more compelling to your stakeholders?',
        'Are the commercial terms in line with your expectations?',
      ],
    },
  ],
  negotiation: [
    {
      category: 'Closing',
      questions: [
        'What final concerns need to be addressed before moving forward?',
        'Is there anything that could prevent this from happening?',
        'What does success look like for the first 90 days?',
        'When can we schedule implementation kickoff?',
      ],
    },
  ],
  closed_won: [],
  closed_lost: [],
};

export const discoveryQuestionsByIndustry: Record<Industry, QuestionCategory[]> = {
  construction: [
    {
      category: 'Project Collaboration',
      questions: [
        'How do you manage document sharing across job sites?',
        'How do subcontractors access project files?',
        'What happens when someone needs a document in the field?',
        'How do you handle submittals and RFIs?',
      ],
    },
    {
      category: 'Compliance',
      questions: [
        'How do you track document versions on active projects?',
        'What records do you need to maintain for compliance?',
        'How do you handle closeout documentation?',
      ],
    },
  ],
  legal: [
    {
      category: 'Matter Management',
      questions: [
        'How do you organize files by matter or client?',
        'How do attorneys collaborate on documents?',
        'What ethical walls do you need to maintain?',
        'How do you share files with clients securely?',
      ],
    },
    {
      category: 'Security & Compliance',
      questions: [
        'What are your data residency requirements?',
        'How do you handle attorney-client privilege in electronic files?',
        'What audit trail capabilities do you need?',
      ],
    },
  ],
  healthcare: [
    {
      category: 'Patient Information',
      questions: [
        'How do you currently share patient information between providers?',
        'What HIPAA controls do you have in place for file sharing?',
        'How do you handle consent forms and patient documents?',
      ],
    },
    {
      category: 'Clinical Workflows',
      questions: [
        'How do care teams collaborate on patient cases?',
        'What systems does content management need to integrate with?',
        'How do you handle medical imaging and large files?',
      ],
    },
  ],
  financial_services: [
    {
      category: 'Client Management',
      questions: [
        'How do you share documents with clients?',
        'What compliance requirements govern your document handling?',
        'How do you handle audit requests?',
      ],
    },
    {
      category: 'Security',
      questions: [
        'What data classification requirements do you have?',
        'How do you prevent unauthorized data sharing?',
        'What are your retention requirements?',
      ],
    },
  ],
  manufacturing: [
    {
      category: 'Product Documentation',
      questions: [
        'How do you manage product specifications and drawings?',
        'How do teams access documentation on the production floor?',
        'How do you handle supplier documentation?',
      ],
    },
    {
      category: 'Quality & Compliance',
      questions: [
        'What quality documentation do you need to maintain?',
        'How do you handle ISO or other certification requirements?',
        'How do you track changes to controlled documents?',
      ],
    },
  ],
  professional_services: [
    {
      category: 'Client Delivery',
      questions: [
        'How do you share deliverables with clients?',
        'How do project teams collaborate on client work?',
        'How do you protect intellectual property?',
      ],
    },
    {
      category: 'Knowledge Management',
      questions: [
        'How do you capture and share institutional knowledge?',
        'How do new team members get up to speed on clients?',
        'How do you reuse work product across engagements?',
      ],
    },
  ],
  other: [
    {
      category: 'General',
      questions: [
        'What are your primary use cases for content management?',
        'Who are the main users of your file sharing system?',
        'What security requirements do you need to meet?',
      ],
    },
  ],
};
