import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, X } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Header } from '../components/layout/Header';
import { DealCard } from '../components/deals/DealCard';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useDeals } from '../hooks/useDeals';
import { useActivityStore } from '../stores/activityStore';
import { isStuckDeal } from '../lib/calculations';
import type { Stage, Industry, DealType } from '../types';
import {
  STAGE_LABELS,
  INDUSTRY_LABELS,
  DEAL_TYPE_LABELS,
  ACTIVE_STAGES,
} from '../lib/constants';

export function DealList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStage = searchParams.get('stage') as Stage | null;
  const initialFilter = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | ''>((initialStage as Stage) || '');
  const [industryFilter, setIndustryFilter] = useState<Industry | ''>('');
  const [dealTypeFilter, setDealTypeFilter] = useState<DealType | ''>('');
  const [sortBy, setSortBy] = useState<'value' | 'expectedCloseDate' | 'stageEnteredDate'>('expectedCloseDate');
  const [sortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showStuckOnly, setShowStuckOnly] = useState(initialFilter === 'stuck');

  const activities = useActivityStore((state) => state.activities);

  const filteredDeals = useDeals(
    {
      stage: stageFilter || undefined,
      industry: industryFilter || undefined,
      dealType: dealTypeFilter || undefined,
      search: search || undefined,
    },
    {
      field: sortBy,
      direction: sortDir,
    }
  );

  const displayDeals = useMemo(() => {
    let deals = filteredDeals.filter(
      (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
    );

    if (showStuckOnly) {
      deals = deals.filter((deal) => isStuckDeal(deal, activities));
    }

    return deals;
  }, [filteredDeals, showStuckOnly, activities]);

  const stageOptions = [
    { value: '', label: 'All Stages' },
    ...ACTIVE_STAGES.map((stage) => ({
      value: stage,
      label: STAGE_LABELS[stage],
    })),
  ];

  const industryOptions = [
    { value: '', label: 'All Industries' },
    ...Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const dealTypeOptions = [
    { value: '', label: 'All Types' },
    ...Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const sortOptions = [
    { value: 'expectedCloseDate', label: 'Close Date' },
    { value: 'value', label: 'Deal Value' },
    { value: 'stageEnteredDate', label: 'Days in Stage' },
  ];

  const hasActiveFilters = stageFilter || industryFilter || dealTypeFilter || showStuckOnly;

  const clearFilters = () => {
    setStageFilter('');
    setIndustryFilter('');
    setDealTypeFilter('');
    setShowStuckOnly(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Deals"
        rightAction={{
          icon: <Filter className="w-5 h-5 text-gray-600" />,
          onClick: () => setShowFilters(true),
          label: 'Filter',
        }}
      />

      <PageContainer>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Active filters chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {stageFilter && (
              <FilterChip
                label={STAGE_LABELS[stageFilter]}
                onRemove={() => setStageFilter('')}
              />
            )}
            {industryFilter && (
              <FilterChip
                label={INDUSTRY_LABELS[industryFilter]}
                onRemove={() => setIndustryFilter('')}
              />
            )}
            {dealTypeFilter && (
              <FilterChip
                label={DEAL_TYPE_LABELS[dealTypeFilter]}
                onRemove={() => setDealTypeFilter('')}
              />
            )}
            {showStuckOnly && (
              <FilterChip
                label="Stuck Deals"
                onRemove={() => setShowStuckOnly(false)}
              />
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-primary-500 ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Deal list */}
        <div className="space-y-3">
          {displayDeals.length > 0 ? (
            displayDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isStuck={isStuckDeal(deal, activities)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No deals found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-primary-500 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* FAB */}
        <div className="fixed bottom-20 right-4">
          <Button
            onClick={() => navigate('/deals/new')}
            className="w-14 h-14 rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </PageContainer>

      {/* Filter Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter & Sort"
        height="auto"
      >
        <div className="space-y-4">
          <Select
            label="Stage"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as Stage | '')}
            options={stageOptions}
          />

          <Select
            label="Industry"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value as Industry | '')}
            options={industryOptions}
          />

          <Select
            label="Deal Type"
            value={dealTypeFilter}
            onChange={(e) => setDealTypeFilter(e.target.value as DealType | '')}
            options={dealTypeOptions}
          />

          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            options={sortOptions}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="stuckOnly"
              checked={showStuckOnly}
              onChange={(e) => setShowStuckOnly(e.target.checked)}
              className="w-4 h-4 text-primary-500 rounded"
            />
            <label htmlFor="stuckOnly" className="text-sm text-gray-700">
              Show stuck deals only
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              fullWidth
            >
              Clear
            </Button>
            <Button onClick={() => setShowFilters(false)} fullWidth>
              Apply
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
      {label}
      <button onClick={onRemove} className="hover:bg-primary-200 rounded-full p-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
