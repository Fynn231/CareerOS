-- COS-SUPABASE-PREP-001: applications table for authenticated owners.
-- Apply through Supabase migration workflow after project creation.
-- This migration intentionally defines only applications; other entities remain unimplemented.

create table if not exists public.applications (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    company text not null,
    role text not null,
    stage text not null,
    notes text not null default '',
    posting_url text,
    applied_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint applications_company_check check (char_length(btrim(company)) between 1 and 120),
    constraint applications_role_check check (char_length(btrim(role)) between 1 and 120),
    constraint applications_notes_length_check check (char_length(notes) <= 2000),
    constraint applications_stage_check check (
        stage in ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn')
    ),
    constraint applications_posting_url_check check (
        posting_url is null or (
            char_length(posting_url) <= 2048
            and posting_url ~ '^https?://[^[:space:]/?#]+'
        )
    )
);

alter table public.applications enable row level security;
alter table public.applications force row level security;

revoke all on table public.applications from anon;
revoke all on table public.applications from authenticated;

grant select, insert, update, delete on table public.applications to authenticated;

create policy "applications_select_own"
    on public.applications
    for select
    to authenticated
    using (auth.uid() = owner_id);

create policy "applications_insert_own"
    on public.applications
    for insert
    to authenticated
    with check (auth.uid() = owner_id);

create policy "applications_update_own"
    on public.applications
    for update
    to authenticated
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

create policy "applications_delete_own"
    on public.applications
    for delete
    to authenticated
    using (auth.uid() = owner_id);

create or replace function public.applications_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := clock_timestamp();
    return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.applications_set_updated_at();