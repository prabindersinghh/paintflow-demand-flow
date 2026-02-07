
-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.inventory_view_for_dashboard SET (security_invoker = on);
ALTER VIEW public.planned_actions_view SET (security_invoker = on);
ALTER VIEW public.forecast_projection_view SET (security_invoker = on);
