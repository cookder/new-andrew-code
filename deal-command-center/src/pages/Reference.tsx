import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Lightbulb, Shield, Zap } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SimpleHeader } from '../components/layout/Header';
import { Card, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { oneDriveDisplacement, boxAIByVertical, discoveryQuestions } from '../data/competitiveIntel';
import { INDUSTRY_LABELS } from '../lib/constants';
import type { Industry } from '../types';
import { cn } from '../lib/utils';

type ReferenceTab = 'competitive' | 'boxai' | 'discovery';

export function Reference() {
  const [activeTab, setActiveTab] = useState<ReferenceTab>('competitive');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('construction');

  const tabs: { id: ReferenceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'competitive', label: 'Competitive', icon: <Shield className="w-4 h-4" /> },
    { id: 'boxai', label: 'Box AI', icon: <Zap className="w-4 h-4" /> },
    { id: 'discovery', label: 'Discovery', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const industryOptions = Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <SimpleHeader title="Reference" />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PageContainer>
        {activeTab === 'competitive' && <CompetitiveTab />}
        {activeTab === 'boxai' && (
          <BoxAITab
            selectedIndustry={selectedIndustry}
            onIndustryChange={setSelectedIndustry}
            industryOptions={industryOptions}
          />
        )}
        {activeTab === 'discovery' && <DiscoveryTab />}
      </PageContainer>
    </div>
  );
}

function CompetitiveTab() {
  return (
    <div className="space-y-4">
      {/* Why Customers Leave */}
      <CollapsibleSection title="Why Customers Leave OneDrive/SharePoint" defaultOpen>
        <ul className="space-y-2">
          {oneDriveDisplacement.whyCustomersLeave.map((reason, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-danger mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Key Advantages */}
      <CollapsibleSection title="Box Key Advantages" defaultOpen>
        <div className="space-y-3">
          {oneDriveDisplacement.keyAdvantages.map((advantage, i) => (
            <div key={i} className="p-3 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-900">{advantage.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{advantage.description}</p>
              <p className="text-sm text-primary-700 mt-2 italic">
                "{advantage.talkingPoint}"
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Objection Handlers */}
      <CollapsibleSection title="Objection Handlers">
        <div className="space-y-4">
          {oneDriveDisplacement.objectionHandlers.map((handler, i) => (
            <div key={i} className="border-l-2 border-primary-500 pl-3">
              <p className="font-medium text-gray-900 mb-2">
                "{handler.objection}"
              </p>
              <p className="text-sm text-gray-700">{handler.response}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Discovery Questions */}
      <CollapsibleSection title="Discovery Questions for Displacement">
        <ul className="space-y-2">
          {oneDriveDisplacement.discoveryQuestions.map((question, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-primary-500 font-medium">{i + 1}.</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}

interface BoxAITabProps {
  selectedIndustry: Industry;
  onIndustryChange: (industry: Industry) => void;
  industryOptions: { value: string; label: string }[];
}

function BoxAITab({ selectedIndustry, onIndustryChange, industryOptions }: BoxAITabProps) {
  const verticalData = boxAIByVertical[selectedIndustry];

  return (
    <div className="space-y-4">
      <Select
        label="Select Industry"
        value={selectedIndustry}
        onChange={(e) => onIndustryChange(e.target.value as Industry)}
        options={industryOptions}
      />

      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-500" />
            Box AI Use Cases for {INDUSTRY_LABELS[selectedIndustry]}
          </div>
        </CardTitle>
        <ul className="mt-3 space-y-2">
          {verticalData.useCases.map((useCase, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-success">✓</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Talking Points
          </div>
        </CardTitle>
        <ul className="mt-3 space-y-2">
          {verticalData.talkingPoints.map((point, i) => (
            <li key={i} className="p-3 bg-warning/10 rounded-lg text-sm text-gray-700 italic">
              "{point}"
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function DiscoveryTab() {
  return (
    <div className="space-y-4">
      <CollapsibleSection title="General Discovery Questions" defaultOpen>
        <ul className="space-y-2">
          {discoveryQuestions.general.map((question, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <MessageSquare className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Security Questions">
        <ul className="space-y-2">
          {discoveryQuestions.security.map((question, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <Shield className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Collaboration Questions">
        <ul className="space-y-2">
          {discoveryQuestions.collaboration.map((question, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <MessageSquare className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Efficiency Questions">
        <ul className="space-y-2">
          {discoveryQuestions.efficiency.map((question, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <Zap className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card padding="none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
}
