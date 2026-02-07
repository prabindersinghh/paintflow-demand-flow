
-- ============================================================
-- VIRTUAL SIMULATION LAYER (non-destructive, additive only)
-- ============================================================

-- 1. Virtual Inventory Projection — simulated future stock
CREATE TABLE public.virtual_inventory_projection (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id uuid NOT NULL,
  sku_id uuid NOT NULL,
  current_stock_l numeric NOT NULL DEFAULT 0,
  projected_stock_l numeric NOT NULL DEFAULT 0,
  incoming_l numeric NOT NULL DEFAULT 0,
  outgoing_l numeric NOT NULL DEFAULT 0,
  simulation_run_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_inventory_projection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Virtual projections readable by authenticated"
  ON public.virtual_inventory_projection FOR SELECT
  USING (true);

CREATE POLICY "Virtual projections insertable by authenticated"
  ON public.virtual_inventory_projection FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Virtual projections deletable by authenticated"
  ON public.virtual_inventory_projection FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 2. Virtual Inventory Movements — each recommendation as a simulated movement
CREATE TABLE public.virtual_inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id uuid NOT NULL,
  from_warehouse uuid,
  to_warehouse uuid,
  quantity_l numeric NOT NULL DEFAULT 0,
  movement_type text NOT NULL, -- transfer / reorder / consumption
  simulated_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Virtual movements readable by authenticated"
  ON public.virtual_inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Virtual movements insertable by authenticated"
  ON public.virtual_inventory_movements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Virtual movements deletable by authenticated"
  ON public.virtual_inventory_movements FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 3. VIEW: inventory_view_for_dashboard
--    Returns projected stock from simulation if available, else current inventory
CREATE OR REPLACE VIEW public.inventory_view_for_dashboard AS
SELECT
  COALESCE(vip.id, i.id) AS id,
  i.product_id,
  i.warehouse_id,
  CASE
    WHEN vip.id IS NOT NULL THEN ROUND(vip.projected_stock_l / NULLIF(p.pack_size_litres, 0))::int
    ELSE i.quantity
  END AS quantity,
  i.last_updated,
  p.id AS "product__id",
  p.sku AS "product__sku",
  p.name AS "product__name",
  p.category AS "product__category",
  p.color AS "product__color",
  p.pack_size_litres AS "product__pack_size_litres",
  p.unit_price AS "product__unit_price",
  p.min_stock AS "product__min_stock",
  w.id AS "warehouse__id",
  w.name AS "warehouse__name",
  w.region AS "warehouse__region"
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN warehouses w ON w.id = i.warehouse_id
LEFT JOIN virtual_inventory_projection vip
  ON vip.sku_id = i.product_id AND vip.warehouse_id = i.warehouse_id;

-- 4. VIEW: planned_actions_view
--    Returns virtual movements formatted like planned_actions
CREATE OR REPLACE VIEW public.planned_actions_view AS
SELECT
  vim.id,
  vim.movement_type AS action_type,
  vim.sku_id AS product_id,
  fw.name AS from_location,
  tw.name AS to_location,
  ROUND(vim.quantity_l / NULLIF(p.pack_size_litres, 0))::int AS quantity,
  'planned'::text AS status,
  NULL::timestamptz AS approved_at,
  vim.simulated_date AS planned_execution_date,
  NULL::timestamptz AS executed_at,
  vim.created_at,
  NULL::uuid AS recommendation_id,
  NULL::text AS approved_by,
  p.id AS "product__id",
  p.sku AS "product__sku",
  p.name AS "product__name",
  p.category AS "product__category",
  p.pack_size_litres AS "product__pack_size_litres",
  p.unit_price AS "product__unit_price",
  p.min_stock AS "product__min_stock"
FROM virtual_inventory_movements vim
JOIN products p ON p.id = vim.sku_id
LEFT JOIN warehouses fw ON fw.id = vim.from_warehouse
LEFT JOIN warehouses tw ON tw.id = vim.to_warehouse
WHERE vim.movement_type IN ('transfer', 'reorder');

-- 5. VIEW: forecast_projection_view
--    Cumulative forecast with current + projected stock
CREATE OR REPLACE VIEW public.forecast_projection_view AS
SELECT
  f.id,
  f.product_id,
  f.region,
  f.forecast_date,
  f.predicted_demand,
  f.confidence,
  f.created_at,
  vip.current_stock_l,
  vip.projected_stock_l,
  vip.incoming_l,
  vip.outgoing_l
FROM forecasts f
LEFT JOIN warehouses w ON w.region = f.region
LEFT JOIN virtual_inventory_projection vip
  ON vip.sku_id = f.product_id AND vip.warehouse_id = w.id;

-- 6. Update get_dashboard_stats to blend virtual projection data
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_litres numeric;
  v_total_value numeric;
  v_total_products integer;
  v_stockout_risk_count integer;
  v_stockout_risk_score numeric;
  v_active_alerts integer;
  v_pending_plans integer;
  v_approved_plans integer;
  v_projected_risks integer;
  v_total_skus integer;
  v_has_simulation boolean;
BEGIN
  -- Check if simulation data exists
  SELECT EXISTS(SELECT 1 FROM virtual_inventory_projection LIMIT 1) INTO v_has_simulation;

  IF v_has_simulation THEN
    -- Use virtual projection data
    SELECT COALESCE(SUM(vip.projected_stock_l), 0)
    INTO v_total_litres
    FROM virtual_inventory_projection vip;

    SELECT COALESCE(SUM(vip.projected_stock_l / NULLIF(p.pack_size_litres, 0) * p.unit_price), 0)
    INTO v_total_value
    FROM virtual_inventory_projection vip
    JOIN products p ON p.id = vip.sku_id;

    -- Stockout risk from virtual projections
    SELECT COUNT(DISTINCT vip.sku_id)
    INTO v_stockout_risk_count
    FROM virtual_inventory_projection vip
    JOIN products p ON p.id = vip.sku_id
    WHERE vip.projected_stock_l / NULLIF(p.pack_size_litres, 0) < p.min_stock;
  ELSE
    -- Fallback to current inventory
    SELECT COALESCE(SUM(i.quantity * p.pack_size_litres), 0)
    INTO v_total_litres
    FROM inventory i
    JOIN products p ON p.id = i.product_id;

    SELECT COALESCE(SUM(i.quantity * p.unit_price), 0)
    INTO v_total_value
    FROM inventory i
    JOIN products p ON p.id = i.product_id;

    SELECT COUNT(DISTINCT ip.product_id)
    INTO v_stockout_risk_count
    FROM inventory_projection ip
    JOIN products p ON p.id = ip.product_id
    WHERE ip.projected_date <= (CURRENT_DATE + INTERVAL '7 days')
      AND ip.projected_quantity < p.min_stock;
  END IF;

  SELECT COUNT(*) INTO v_total_skus FROM products;
  SELECT COUNT(*) INTO v_total_products FROM products;

  v_stockout_risk_score := CASE WHEN v_total_products > 0
    THEN ROUND((v_stockout_risk_count::numeric / v_total_products) * 100)
    ELSE 0 END;

  SELECT COUNT(*) INTO v_active_alerts FROM alerts;

  SELECT COUNT(*) INTO v_pending_plans
  FROM planned_actions WHERE status = 'pending';

  SELECT COUNT(*) INTO v_approved_plans
  FROM planned_actions WHERE status = 'approved';

  SELECT COUNT(DISTINCT (ip.product_id, ip.warehouse_id))
  INTO v_projected_risks
  FROM inventory_projection ip
  WHERE ip.projected_quantity < 0;

  RETURN jsonb_build_object(
    'total_litres', v_total_litres,
    'total_value', v_total_value,
    'total_skus', v_total_skus,
    'stockout_risk_score', v_stockout_risk_score,
    'active_alerts', v_active_alerts,
    'pending_plans', v_pending_plans,
    'approved_plans', v_approved_plans,
    'projected_risks', v_projected_risks
  );
END;
$$;
