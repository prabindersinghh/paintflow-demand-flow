
-- Create planned_actions table
CREATE TABLE public.planned_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID REFERENCES public.recommendations(id),
  action_type TEXT NOT NULL, -- 'transfer', 'reorder', 'order'
  product_id UUID REFERENCES public.products(id),
  from_location TEXT,
  to_location TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  planned_execution_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'rejected'
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planned_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planned actions readable by authenticated"
  ON public.planned_actions FOR SELECT USING (true);

CREATE POLICY "Planned actions insertable by authenticated"
  ON public.planned_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update planned actions"
  ON public.planned_actions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create inventory_projection table
CREATE TABLE public.inventory_projection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  projected_date DATE NOT NULL,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  planned_inbound INTEGER NOT NULL DEFAULT 0,
  planned_outbound INTEGER NOT NULL DEFAULT 0,
  forecasted_demand INTEGER NOT NULL DEFAULT 0,
  projected_quantity INTEGER NOT NULL DEFAULT 0,
  based_on_plan BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_projection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projections readable by authenticated"
  ON public.inventory_projection FOR SELECT USING (true);

CREATE POLICY "Projections insertable by authenticated"
  ON public.inventory_projection FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Projections deletable by authenticated"
  ON public.inventory_projection FOR DELETE USING (auth.uid() IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_planned_actions_status ON public.planned_actions(status);
CREATE INDEX idx_planned_actions_product ON public.planned_actions(product_id);
CREATE INDEX idx_inventory_projection_product_date ON public.inventory_projection(product_id, projected_date);
CREATE INDEX idx_inventory_projection_warehouse_date ON public.inventory_projection(warehouse_id, projected_date);
