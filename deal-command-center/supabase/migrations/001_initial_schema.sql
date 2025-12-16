-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Deals table
create table deals (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  deal_name text not null,
  value numeric not null default 0,
  probability integer not null default 10,
  stage text not null default 'discovery',
  stage_entered_date date not null default current_date,
  expected_close_date date,
  deal_type text not null default 'new_logo',
  industry text not null default 'other',
  tags text[] default '{}',
  current_situation text,
  desired_outcome text,
  quantified_impact text,
  decision_process text,
  competition text,
  why_we_win text,
  risks text,
  next_step text,
  next_step_owner text default 'me',
  next_step_due_date date,
  user_count integer default 0,
  product_tier text default 'enterprise',
  add_ons text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contacts table
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  role text not null default 'influencer',
  engagement_level text default 'warm',
  last_contact_date date,
  notes text,
  created_at timestamptz default now()
);

-- Activities table
create table activities (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade,
  type text not null default 'note',
  activity_date timestamptz not null default now(),
  summary text not null,
  outcome text default 'neutral',
  created_at timestamptz default now()
);

-- Quota tracking table
create table quota_months (
  id uuid primary key default uuid_generate_v4(),
  month integer not null,
  year integer not null,
  target numeric not null default 0,
  closed_won numeric not null default 0,
  unique(month, year)
);

-- Indexes for performance
create index idx_deals_stage on deals(stage);
create index idx_deals_close_date on deals(expected_close_date);
create index idx_activities_deal on activities(deal_id);
create index idx_activities_date on activities(activity_date);
create index idx_contacts_deal on contacts(deal_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row
  execute function update_updated_at();
