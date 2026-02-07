
-- Fix overly permissive orders insert policy
DROP POLICY "Orders insertable by authenticated" ON public.orders;
CREATE POLICY "Authenticated users can place orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    dealer_id IN (SELECT d.id FROM public.dealers d)
    AND quantity > 0
  );
