
-- Database function to compute dashboard stats from real joins
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
BEGIN
  -- Current Inventory (L): SUM(inventory.quantity * products.pack_size_litres)
  SELECT COALESCE(SUM(i.quantity * p.pack_size_litres), 0)
  INTO v_total_litres
  FROM inventory i
  JOIN products p ON p.id = i.product_id;

  -- Inventory Value: SUM(inventory.quantity * products.unit_price)
  -- unit_price is per pack, so value = quantity * unit_price
  SELECT COALESCE(SUM(i.quantity * p.unit_price), 0)
  INTO v_total_value
  FROM inventory i
  JOIN products p ON p.id = i.product_id;

  -- Total SKUs
  SELECT COUNT(*) INTO v_total_skus FROM products;

  -- Stockout Risk: products where any 7-day projection < min_stock
  SELECT COUNT(DISTINCT ip.product_id)
  INTO v_stockout_risk_count
  FROM inventory_projection ip
  JOIN products p ON p.id = ip.product_id
  WHERE ip.projected_date <= (CURRENT_DATE + INTERVAL '7 days')
    AND ip.projected_quantity < p.min_stock;

  SELECT COUNT(*) INTO v_total_products FROM products;
  v_stockout_risk_score := CASE WHEN v_total_products > 0
    THEN ROUND((v_stockout_risk_count::numeric / v_total_products) * 100)
    ELSE 0 END;

  -- Active Alerts: count all alerts (no status column; all stored alerts are active)
  SELECT COUNT(*) INTO v_active_alerts FROM alerts;

  -- Pending Plans
  SELECT COUNT(*) INTO v_pending_plans
  FROM planned_actions WHERE status = 'pending';

  -- Approved Plans
  SELECT COUNT(*) INTO v_approved_plans
  FROM planned_actions WHERE status = 'approved';

  -- Projected Risks: projections where projected_quantity < 0
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
