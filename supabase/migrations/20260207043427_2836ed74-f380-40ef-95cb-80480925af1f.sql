
-- Tighten INSERT policies to require authentication
DROP POLICY IF EXISTS "Activity log insertable by authenticated" ON public.activity_log;
CREATE POLICY "Activity log insertable by authenticated"
ON public.activity_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Movements insertable by authenticated" ON public.inventory_movements;
CREATE POLICY "Movements insertable by authenticated"
ON public.inventory_movements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
