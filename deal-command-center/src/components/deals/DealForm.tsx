import { useState } from 'react';
import type { Deal, Stage, Industry, DealType, ProductTier } from '../../types';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  STAGE_LABELS,
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  PRODUCT_TIER_LABELS,
  ACTIVE_STAGES,
} from '../../lib/constants';
import { toISODateString } from '../../lib/utils';

interface DealFormProps {
  initialData?: Partial<Deal>;
  onSubmit: (data: Partial<Deal>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function DealForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: DealFormProps) {
  const [formData, setFormData] = useState<Partial<Deal>>({
    companyName: '',
    dealName: '',
    value: 0,
    stage: 'discovery' as Stage,
    expectedCloseDate: toISODateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    dealType: 'new_logo' as DealType,
    industry: 'other' as Industry,
    userCount: 0,
    productTier: 'enterprise' as ProductTier,
    addOns: [],
    currentSituation: '',
    desiredOutcome: '',
    quantifiedImpact: '',
    competition: '',
    whyWeWin: '',
    risks: '',
    nextStep: '',
    nextStepOwner: 'me',
    ...initialData,
  });

  const handleChange = (field: keyof Deal, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const stageOptions = Object.entries(STAGE_LABELS)
    .filter(([key]) => ACTIVE_STAGES.includes(key as Stage))
    .map(([value, label]) => ({ value, label }));

  const industryOptions = Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const dealTypeOptions = Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const tierOptions = Object.entries(PRODUCT_TIER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Basic Information</h3>

        <Input
          label="Company Name"
          value={formData.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
          required
          placeholder="Acme Construction"
        />

        <Input
          label="Deal Name"
          value={formData.dealName}
          onChange={(e) => handleChange('dealName', e.target.value)}
          required
          placeholder="Enterprise Rollout"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Deal Value (ARR)"
            type="number"
            value={formData.value}
            onChange={(e) => handleChange('value', Number(e.target.value))}
            required
            min={0}
          />

          <Input
            label="User Count"
            type="number"
            value={formData.userCount}
            onChange={(e) => handleChange('userCount', Number(e.target.value))}
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Stage"
            value={formData.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
            options={stageOptions}
          />

          <Input
            label="Expected Close"
            type="date"
            value={formData.expectedCloseDate}
            onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Deal Type"
            value={formData.dealType}
            onChange={(e) => handleChange('dealType', e.target.value)}
            options={dealTypeOptions}
          />

          <Select
            label="Industry"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            options={industryOptions}
          />
        </div>

        <Select
          label="Product Tier"
          value={formData.productTier}
          onChange={(e) => handleChange('productTier', e.target.value)}
          options={tierOptions}
        />
      </div>

      {/* Deal Intelligence */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Deal Intelligence</h3>

        <TextArea
          label="Current Situation"
          value={formData.currentSituation}
          onChange={(e) => handleChange('currentSituation', e.target.value)}
          placeholder="What's their current state? What tools are they using?"
          rows={2}
        />

        <TextArea
          label="Desired Outcome"
          value={formData.desiredOutcome}
          onChange={(e) => handleChange('desiredOutcome', e.target.value)}
          placeholder="What do they want to achieve?"
          rows={2}
        />

        <TextArea
          label="Quantified Impact"
          value={formData.quantifiedImpact}
          onChange={(e) => handleChange('quantifiedImpact', e.target.value)}
          placeholder='The "$X problem" - what does this cost them?'
          rows={2}
        />

        <TextArea
          label="Competition"
          value={formData.competition}
          onChange={(e) => handleChange('competition', e.target.value)}
          placeholder="Who are we competing against?"
          rows={2}
        />

        <TextArea
          label="Why We Win"
          value={formData.whyWeWin}
          onChange={(e) => handleChange('whyWeWin', e.target.value)}
          placeholder="Our competitive advantage in this deal"
          rows={2}
        />

        <TextArea
          label="Risks"
          value={formData.risks}
          onChange={(e) => handleChange('risks', e.target.value)}
          placeholder="What could go wrong?"
          rows={2}
        />
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Next Steps</h3>

        <Input
          label="Next Step"
          value={formData.nextStep}
          onChange={(e) => handleChange('nextStep', e.target.value)}
          placeholder="Schedule technical deep dive"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Owner"
            value={formData.nextStepOwner}
            onChange={(e) => handleChange('nextStepOwner', e.target.value)}
            options={[
              { value: 'me', label: 'Me' },
              { value: 'prospect', label: 'Prospect' },
            ]}
          />

          <Input
            label="Due Date"
            type="date"
            value={formData.nextStepDueDate || ''}
            onChange={(e) => handleChange('nextStepDueDate', e.target.value || null)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button type="submit" fullWidth>
          {isEditing ? 'Save Changes' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}
