
-- Historical sales data for forecasting
CREATE TABLE public.historical_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) NOT NULL,
  region text NOT NULL,
  sale_date date NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.historical_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historical sales readable by authenticated"
ON public.historical_sales FOR SELECT
USING (true);

CREATE INDEX idx_historical_sales_product_region_date
ON public.historical_sales(product_id, region, sale_date);

-- Activity log for audit trail
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  user_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log readable by authenticated"
ON public.activity_log FOR SELECT
USING (true);

CREATE POLICY "Activity log insertable by authenticated"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- Inventory movements for transfer tracking
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES public.recommendations(id),
  source_warehouse_id uuid REFERENCES public.warehouses(id),
  destination_warehouse_id uuid REFERENCES public.warehouses(id),
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL,
  movement_type text NOT NULL, -- 'transfer', 'reorder', 'order'
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movements readable by authenticated"
ON public.inventory_movements FOR SELECT
USING (true);

CREATE POLICY "Movements insertable by authenticated"
ON public.inventory_movements FOR INSERT
WITH CHECK (true);

-- Add dealer_id to orders if missing context
-- Add executed status tracking to recommendations
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS executed_at timestamptz;

-- DB functions for transactional operations

-- Execute a transfer: subtract from source, add to destination
CREATE OR REPLACE FUNCTION public.execute_transfer(
  p_recommendation_id uuid,
  p_source_warehouse_id uuid,
  p_dest_warehouse_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_user_name text DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_qty integer;
  v_result jsonb;
BEGIN
  -- Check source has enough stock
  SELECT quantity INTO v_source_qty
  FROM inventory
  WHERE warehouse_id = p_source_warehouse_id AND product_id = p_product_id
  FOR UPDATE;

  IF v_source_qty IS NULL OR v_source_qty < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock in source warehouse');
  END IF;

  -- Subtract from source
  UPDATE inventory
  SET quantity = quantity - p_quantity, last_updated = now()
  WHERE warehouse_id = p_source_warehouse_id AND product_id = p_product_id;

  -- Add to destination (upsert)
  INSERT INTO inventory (warehouse_id, product_id, quantity, last_updated)
  VALUES (p_dest_warehouse_id, p_product_id, p_quantity, now())
  ON CONFLICT (warehouse_id, product_id)
  DO UPDATE SET quantity = inventory.quantity + p_quantity, last_updated = now();

  -- Update recommendation status
  IF p_recommendation_id IS NOT NULL THEN
    UPDATE recommendations
    SET status = 'executed', executed_at = now()
    WHERE id = p_recommendation_id;
  END IF;

  -- Record movement
  INSERT INTO inventory_movements (recommendation_id, source_warehouse_id, destination_warehouse_id, product_id, quantity, movement_type)
  VALUES (p_recommendation_id, p_source_warehouse_id, p_dest_warehouse_id, p_product_id, p_quantity, 'transfer');

  -- Activity log
  INSERT INTO activity_log (user_name, action, entity_type, entity_id, details)
  VALUES (p_user_name, 'transfer_executed', 'recommendation', p_recommendation_id::text,
    jsonb_build_object('product_id', p_product_id, 'quantity', p_quantity, 'from', p_source_warehouse_id, 'to', p_dest_warehouse_id));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Execute a dealer order: reduce warehouse stock, create order
CREATE OR REPLACE FUNCTION public.execute_dealer_order(
  p_dealer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_warehouse_id uuid,
  p_recommendation_id uuid DEFAULT NULL,
  p_user_name text DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warehouse_qty integer;
  v_order_id uuid;
BEGIN
  -- Check warehouse stock
  SELECT quantity INTO v_warehouse_qty
  FROM inventory
  WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id
  FOR UPDATE;

  IF v_warehouse_qty IS NULL OR v_warehouse_qty < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient warehouse stock');
  END IF;

  -- Reduce warehouse stock
  UPDATE inventory
  SET quantity = quantity - p_quantity, last_updated = now()
  WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;

  -- Create order record
  INSERT INTO orders (dealer_id, product_id, quantity, status)
  VALUES (p_dealer_id, p_product_id, p_quantity, 'fulfilled')
  RETURNING id INTO v_order_id;

  -- Update recommendation if linked
  IF p_recommendation_id IS NOT NULL THEN
    UPDATE recommendations
    SET status = 'executed', executed_at = now()
    WHERE id = p_recommendation_id;
  END IF;

  -- Record movement
  INSERT INTO inventory_movements (recommendation_id, source_warehouse_id, product_id, quantity, movement_type)
  VALUES (p_recommendation_id, p_warehouse_id, p_product_id, p_quantity, 'order');

  -- Activity log
  INSERT INTO activity_log (user_name, action, entity_type, entity_id, details)
  VALUES (p_user_name, 'order_placed', 'order', v_order_id::text,
    jsonb_build_object('dealer_id', p_dealer_id, 'product_id', p_product_id, 'quantity', p_quantity));

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- Add unique constraint on inventory for upsert
ALTER TABLE public.inventory ADD CONSTRAINT inventory_warehouse_product_unique UNIQUE (warehouse_id, product_id);
