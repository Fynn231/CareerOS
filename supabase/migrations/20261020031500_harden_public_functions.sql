-- Harden public functions identified by the Supabase database linter.
-- Trigger/event-trigger execution is internal; application roles do not need RPC access.

alter function public.applications_set_updated_at()
    set search_path = pg_catalog;

revoke all on function public.applications_set_updated_at() from public;
revoke all on function public.applications_set_updated_at() from anon;
revoke all on function public.applications_set_updated_at() from authenticated;

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;
