import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, ChevronRight } from 'lucide-react';
import { PageContainer, Section } from '../components/layout/PageContainer';
import { SimpleHeader } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  calculateMigrationROI,
  calculateExpansionROI,
  calculateDealPricing,
} from '../lib/calculations';
import { formatCurrency } from '../lib/utils';
import { PRODUCT_TIER_LABELS } from '../lib/constants';
import type { MigrationInputs, ExpansionInputs, DealConfig, ProductTier } from '../types';

export function Calculators() {
  const [showMigrationCalc, setShowMigrationCalc] = useState(false);
  const [showExpansionCalc, setShowExpansionCalc] = useState(false);
  const [showDealMath, setShowDealMath] = useState(false);

  return (
    <div className="flex flex-col min-h-full">
      <SimpleHeader title="Calculators" />
      <PageContainer>
        <Section>
          <div className="space-y-3">
            <CalcCard
              icon={<TrendingUp className="w-5 h-5 text-primary-500" />}
              title="Migration ROI Calculator"
              description="Calculate savings for OneDrive/SharePoint displacement"
              onClick={() => setShowMigrationCalc(true)}
            />

            <CalcCard
              icon={<DollarSign className="w-5 h-5 text-success" />}
              title="Expansion ROI Calculator"
              description="Calculate value of tier upgrades and add-ons"
              onClick={() => setShowExpansionCalc(true)}
            />

            <CalcCard
              icon={<Calculator className="w-5 h-5 text-warning" />}
              title="Deal Math Calculator"
              description="Build pricing for any deal configuration"
              onClick={() => setShowDealMath(true)}
            />
          </div>
        </Section>
      </PageContainer>

      <Modal
        isOpen={showMigrationCalc}
        onClose={() => setShowMigrationCalc(false)}
        title="Migration ROI Calculator"
        size="lg"
      >
        <MigrationCalculator />
      </Modal>

      <Modal
        isOpen={showExpansionCalc}
        onClose={() => setShowExpansionCalc(false)}
        title="Expansion ROI Calculator"
        size="lg"
      >
        <ExpansionCalculator />
      </Modal>

      <Modal
        isOpen={showDealMath}
        onClose={() => setShowDealMath(false)}
        title="Deal Math Calculator"
        size="lg"
      >
        <DealMathCalculator />
      </Modal>
    </div>
  );
}

interface CalcCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function CalcCard({ icon, title, description, onClick }: CalcCardProps) {
  return (
    <Card onClick={onClick} hoverable>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Card>
  );
}

function MigrationCalculator() {
  const [inputs, setInputs] = useState<MigrationInputs>({
    currentSolution: 'OneDrive/SharePoint',
    numberOfUsers: 500,
    currentCostPerUser: 12.5,
    itSupportHoursPerWeek: 20,
    averageItHourlyRate: 75,
    securityIncidentsPerYear: 4,
    averageIncidentCost: 25000,
    productivityHoursLostPerUserPerMonth: 2,
    averageEmployeeHourlyRate: 50,
  });

  const [results, setResults] = useState<ReturnType<typeof calculateMigrationROI> | null>(null);

  const handleCalculate = () => {
    const result = calculateMigrationROI(inputs);
    setResults(result);
  };

  const updateInput = (field: keyof MigrationInputs, value: number | string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setResults(null);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Number of Users"
        type="number"
        value={inputs.numberOfUsers}
        onChange={(e) => updateInput('numberOfUsers', Number(e.target.value))}
      />

      <Input
        label="Current Cost Per User (Monthly)"
        type="number"
        value={inputs.currentCostPerUser}
        onChange={(e) => updateInput('currentCostPerUser', Number(e.target.value))}
        helperText="Include licensing, storage overages, CALs"
      />

      <Input
        label="IT Support Hours/Week on File Issues"
        type="number"
        value={inputs.itSupportHoursPerWeek}
        onChange={(e) => updateInput('itSupportHoursPerWeek', Number(e.target.value))}
      />

      <Input
        label="Average IT Hourly Rate"
        type="number"
        value={inputs.averageItHourlyRate}
        onChange={(e) => updateInput('averageItHourlyRate', Number(e.target.value))}
      />

      <Input
        label="Security Incidents Per Year"
        type="number"
        value={inputs.securityIncidentsPerYear}
        onChange={(e) => updateInput('securityIncidentsPerYear', Number(e.target.value))}
      />

      <Input
        label="Average Incident Cost"
        type="number"
        value={inputs.averageIncidentCost}
        onChange={(e) => updateInput('averageIncidentCost', Number(e.target.value))}
      />

      <Input
        label="Productivity Hours Lost/User/Month"
        type="number"
        value={inputs.productivityHoursLostPerUserPerMonth}
        onChange={(e) => updateInput('productivityHoursLostPerUserPerMonth', Number(e.target.value))}
        helperText="Time spent on sync issues, searching for files"
      />

      <Button onClick={handleCalculate} fullWidth>
        Calculate ROI
      </Button>

      {results && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg space-y-3">
          <h3 className="font-semibold text-primary-900">Results</h3>

          <ResultRow label="Current Annual Cost" value={formatCurrency(results.currentAnnualCost)} />
          <ResultRow label="Box Annual Cost" value={formatCurrency(results.boxAnnualCost)} />
          <ResultRow
            label="Annual Savings"
            value={formatCurrency(results.annualSavings)}
            highlight
          />
          <ResultRow label="3-Year Savings" value={formatCurrency(results.threeYearSavings)} />
          <ResultRow label="ROI" value={`${results.roiPercentage.toFixed(0)}%`} highlight />
          <ResultRow label="Payback Period" value={`${results.paybackMonths} months`} />

          <div className="pt-3 border-t border-primary-200">
            <p className="text-sm font-medium text-primary-800">Savings Breakdown:</p>
            <ResultRow label="IT Time Savings" value={formatCurrency(results.itTimeSavings)} small />
            <ResultRow
              label="Security Cost Reduction"
              value={formatCurrency(results.securityCostReduction)}
              small
            />
            <ResultRow
              label="Productivity Gains"
              value={formatCurrency(results.productivityGains)}
              small
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ExpansionCalculator() {
  const [inputs, setInputs] = useState<ExpansionInputs>({
    currentUsers: 100,
    newUsers: 50,
    currentTier: 'enterprise',
    proposedTier: 'enterprise_plus',
    addOns: [],
  });

  const [results, setResults] = useState<ReturnType<typeof calculateExpansionROI> | null>(null);

  const handleCalculate = () => {
    const result = calculateExpansionROI(inputs);
    setResults(result);
  };

  const tierOptions = Object.entries(PRODUCT_TIER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-4">
      <Input
        label="Current Users"
        type="number"
        value={inputs.currentUsers}
        onChange={(e) =>
          setInputs((prev) => ({ ...prev, currentUsers: Number(e.target.value) }))
        }
      />

      <Input
        label="New Users to Add"
        type="number"
        value={inputs.newUsers}
        onChange={(e) =>
          setInputs((prev) => ({ ...prev, newUsers: Number(e.target.value) }))
        }
      />

      <Select
        label="Current Tier"
        value={inputs.currentTier}
        onChange={(e) =>
          setInputs((prev) => ({ ...prev, currentTier: e.target.value as ProductTier }))
        }
        options={tierOptions}
      />

      <Select
        label="Proposed Tier"
        value={inputs.proposedTier}
        onChange={(e) =>
          setInputs((prev) => ({ ...prev, proposedTier: e.target.value as ProductTier }))
        }
        options={tierOptions}
      />

      <Button onClick={handleCalculate} fullWidth>
        Calculate Expansion Value
      </Button>

      {results && (
        <div className="mt-6 p-4 bg-success/10 rounded-lg space-y-3">
          <h3 className="font-semibold text-green-900">Results</h3>

          <ResultRow label="Current ARR" value={formatCurrency(results.currentARR)} />
          <ResultRow label="New ARR" value={formatCurrency(results.newARR)} />
          <ResultRow
            label="Expansion Value"
            value={formatCurrency(results.expansionValue)}
            highlight
          />
          <ResultRow
            label="Per User Increase"
            value={formatCurrency(results.perUserIncrease)}
          />
        </div>
      )}
    </div>
  );
}

function DealMathCalculator() {
  const [config, setConfig] = useState<DealConfig>({
    userCount: 100,
    productTier: 'enterprise',
    addOns: [],
    contractLength: 12,
    discount: 0,
  });

  const [results, setResults] = useState<ReturnType<typeof calculateDealPricing> | null>(null);

  const handleCalculate = () => {
    const result = calculateDealPricing(config);
    setResults(result);
  };

  const tierOptions = Object.entries(PRODUCT_TIER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-4">
      <Input
        label="User Count"
        type="number"
        value={config.userCount}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, userCount: Number(e.target.value) }))
        }
      />

      <Select
        label="Product Tier"
        value={config.productTier}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, productTier: e.target.value as ProductTier }))
        }
        options={tierOptions}
      />

      <Input
        label="Contract Length (Months)"
        type="number"
        value={config.contractLength}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, contractLength: Number(e.target.value) }))
        }
      />

      <Input
        label="Discount %"
        type="number"
        value={config.discount}
        onChange={(e) =>
          setConfig((prev) => ({ ...prev, discount: Number(e.target.value) }))
        }
        min={0}
        max={100}
      />

      <Button onClick={handleCalculate} fullWidth>
        Calculate Pricing
      </Button>

      {results && (
        <div className="mt-6 p-4 bg-warning/10 rounded-lg space-y-3">
          <h3 className="font-semibold text-yellow-900">Results</h3>

          <ResultRow label="Monthly Total" value={formatCurrency(results.monthlyTotal)} />
          <ResultRow
            label="Annual/Contract Total"
            value={formatCurrency(results.annualTotal)}
            highlight
          />
          <ResultRow
            label="Per User (Monthly)"
            value={formatCurrency(results.perUserMonthly)}
          />

          <div className="pt-3 border-t border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">Breakdown:</p>
            <ResultRow label="Base Tier" value={formatCurrency(results.breakdown.baseTier)} small />
            <ResultRow label="Add-ons" value={formatCurrency(results.breakdown.addOns)} small />
            <ResultRow
              label="Discount"
              value={`-${formatCurrency(results.breakdown.discount)}`}
              small
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}

function ResultRow({ label, value, highlight, small }: ResultRowProps) {
  return (
    <div className={`flex justify-between ${small ? 'text-sm' : ''}`}>
      <span className={highlight ? 'font-medium' : 'text-gray-600'}>{label}</span>
      <span className={highlight ? 'font-bold text-lg' : 'font-medium'}>{value}</span>
    </div>
  );
}
