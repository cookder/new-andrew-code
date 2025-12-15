import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Users,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Header } from '../components/layout/Header';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StageBadge, Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BottomSheet, ActionSheet } from '../components/ui/BottomSheet';
import { StageSelector, StagePipeline } from '../components/deals/StageSelector';
import { StakeholderCard } from '../components/deals/StakeholderCard';
import { ActivityTimeline } from '../components/deals/ActivityItem';
import { DealForm } from '../components/deals/DealForm';
import { QuickCapture } from './QuickCapture';
import { useDealStore } from '../stores/dealStore';
import { useContactStore } from '../stores/contactStore';
import { useActivityStore } from '../stores/activityStore';
import { formatCurrency, formatRelativeDate } from '../lib/utils';
import { calculateDaysInStage } from '../lib/calculations';
import {
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  PRODUCT_TIER_LABELS,
  ADD_ON_LABELS,
} from '../lib/constants';
import type { Deal, Stage } from '../types';

type TabId = 'overview' | 'stakeholders' | 'activity' | 'intel';

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const deal = useDealStore((state) => state.getDeal(id || ''));
  const updateDeal = useDealStore((state) => state.updateDeal);
  const updateStage = useDealStore((state) => state.updateStage);
  const deleteDeal = useDealStore((state) => state.deleteDeal);
  const contacts = useContactStore((state) => state.getContactsByDeal(id || ''));
  const deleteContactsByDeal = useContactStore((state) => state.deleteContactsByDeal);
  const activities = useActivityStore((state) => state.getActivitiesByDeal(id || ''));
  const deleteActivitiesByDeal = useActivityStore((state) => state.deleteActivitiesByDeal);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showActions, setShowActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageSheet, setShowStageSheet] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!deal) {
    return (
      <div className="flex flex-col min-h-full">
        <Header title="Deal Not Found" showBack />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-gray-500">This deal doesn't exist or was deleted.</p>
            <Button onClick={() => navigate('/deals')} className="mt-4">
              Back to Deals
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  const handleDelete = () => {
    deleteContactsByDeal(deal.id);
    deleteActivitiesByDeal(deal.id);
    deleteDeal(deal.id);
    navigate('/deals');
  };

  const handleStageChange = (stage: Stage) => {
    updateStage(deal.id, stage);
    setShowStageSheet(false);
  };

  const handleEditSubmit = (data: Partial<Deal>) => {
    updateDeal(deal.id, data);
    setShowEditModal(false);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'stakeholders', label: 'People' },
    { id: 'activity', label: 'Activity' },
    { id: 'intel', label: 'Intel' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={deal.companyName}
        subtitle={deal.dealName}
        showBack
        rightAction={{
          icon: <MoreVertical className="w-5 h-5 text-gray-600" />,
          onClick: () => setShowActions(true),
        }}
      />

      {/* Deal Header Card */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStageSheet(true)}>
              <StageBadge stage={deal.stage} />
            </button>
            <Badge variant="default" size="sm">
              {DEAL_TYPE_LABELS[deal.dealType]}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(deal.value)}
            </p>
            <p className="text-xs text-gray-500">{deal.probability}% probability</p>
          </div>
        </div>
        <StagePipeline currentStage={deal.stage} />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-500 border-primary-500'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PageContainer>
        {activeTab === 'overview' && (
          <OverviewTab deal={deal} onEdit={() => setShowEditModal(true)} />
        )}
        {activeTab === 'stakeholders' && (
          <StakeholdersTab contacts={contacts} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab
            activities={activities}
            onAddActivity={() => setShowQuickCapture(true)}
          />
        )}
        {activeTab === 'intel' && <IntelTab deal={deal} />}

        {/* Quick Action FAB */}
        <div className="fixed bottom-20 right-4">
          <Button
            onClick={() => setShowQuickCapture(true)}
            className="w-14 h-14 rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </PageContainer>

      {/* Action Sheet */}
      <ActionSheet
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        title="Deal Actions"
        actions={[
          {
            label: 'Edit Deal',
            icon: <Edit className="w-5 h-5" />,
            onClick: () => {
              setShowActions(false);
              setShowEditModal(true);
            },
          },
          {
            label: 'Change Stage',
            onClick: () => {
              setShowActions(false);
              setShowStageSheet(true);
            },
          },
          {
            label: 'Delete Deal',
            icon: <Trash2 className="w-5 h-5" />,
            variant: 'danger',
            onClick: () => {
              setShowActions(false);
              setShowDeleteConfirm(true);
            },
          },
        ]}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Deal"
        size="lg"
      >
        <DealForm
          initialData={deal}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
          isEditing
        />
      </Modal>

      {/* Stage Sheet */}
      <BottomSheet
        isOpen={showStageSheet}
        onClose={() => setShowStageSheet(false)}
        title="Change Stage"
      >
        <StageSelector
          currentStage={deal.stage}
          onStageChange={handleStageChange}
        />
      </BottomSheet>

      {/* Quick Capture */}
      <BottomSheet
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        title="Log Activity"
        height="auto"
      >
        <QuickCapture
          dealId={deal.id}
          onComplete={() => setShowQuickCapture(false)}
        />
      </BottomSheet>

      {/* Delete Confirm */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Deal"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this deal? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(false)}
            fullWidth
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function OverviewTab({ deal, onEdit }: { deal: Deal; onEdit: () => void }) {
  const daysInStage = calculateDaysInStage(deal);

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Expected Close</p>
            <p className="font-medium text-gray-900">
              {formatRelativeDate(deal.expectedCloseDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Days in Stage</p>
            <p className="font-medium text-gray-900">{daysInStage} days</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Industry</p>
            <p className="font-medium text-gray-900">
              {INDUSTRY_LABELS[deal.industry]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Users</p>
            <p className="font-medium text-gray-900">{deal.userCount || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Next Step */}
      {deal.nextStep && (
        <Card>
          <CardTitle>Next Step</CardTitle>
          <p className="text-gray-700 mt-2">{deal.nextStep}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Owner: {deal.nextStepOwner === 'me' ? 'Me' : 'Prospect'}</span>
            {deal.nextStepDueDate && (
              <span>Due: {formatRelativeDate(deal.nextStepDueDate)}</span>
            )}
          </div>
        </Card>
      )}

      {/* Deal Intelligence */}
      <Card>
        <CardTitle>Deal Intelligence</CardTitle>
        <div className="space-y-3 mt-3">
          {deal.currentSituation && (
            <InfoRow label="Current Situation" value={deal.currentSituation} />
          )}
          {deal.desiredOutcome && (
            <InfoRow label="Desired Outcome" value={deal.desiredOutcome} />
          )}
          {deal.quantifiedImpact && (
            <InfoRow label="Quantified Impact" value={deal.quantifiedImpact} />
          )}
          {deal.competition && (
            <InfoRow label="Competition" value={deal.competition} />
          )}
          {deal.whyWeWin && (
            <InfoRow label="Why We Win" value={deal.whyWeWin} />
          )}
          {deal.risks && <InfoRow label="Risks" value={deal.risks} />}
        </div>
        <Button variant="ghost" onClick={onEdit} className="mt-4 w-full">
          <Edit className="w-4 h-4 mr-2" />
          Edit Details
        </Button>
      </Card>

      {/* Product Config */}
      <Card>
        <CardTitle>Product Configuration</CardTitle>
        <div className="space-y-2 mt-3">
          <InfoRow label="Tier" value={PRODUCT_TIER_LABELS[deal.productTier]} />
          {deal.addOns.length > 0 && (
            <InfoRow
              label="Add-ons"
              value={deal.addOns.map((a) => ADD_ON_LABELS[a]).join(', ')}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function StakeholdersTab({
  contacts,
}: {
  contacts: ReturnType<typeof useContactStore.getState>['contacts'];
}) {
  return (
    <div className="space-y-3">
      {contacts.length > 0 ? (
        contacts.map((contact) => (
          <StakeholderCard key={contact.id} contact={contact} />
        ))
      ) : (
        <div className="text-center py-8">
          <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No stakeholders added yet</p>
        </div>
      )}
    </div>
  );
}

function ActivityTab({
  activities,
  onAddActivity,
}: {
  activities: ReturnType<typeof useActivityStore.getState>['activities'];
  onAddActivity: () => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <Button onClick={onAddActivity} variant="outline" fullWidth>
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </div>
      <ActivityTimeline activities={activities} />
    </div>
  );
}

function IntelTab({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Quick Reference</CardTitle>
        <p className="text-sm text-gray-500 mt-2">
          Use the Reference tab in the bottom nav for competitive intelligence,
          discovery questions, and Box AI value props for {INDUSTRY_LABELS[deal.industry]}.
        </p>
      </Card>
    </div>
  );
}
