// PaintFlow.ai — Type definitions and constants only (no generators)
// All data now comes from the database

export const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const;
export type Region = (typeof REGIONS)[number];

export type UserRole = 'admin' | 'distributor' | 'dealer' | 'viewer';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  color: string | null;
  unit_price: number;
  min_stock: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  last_updated: string;
  products?: Product;
  warehouses?: { id: string; name: string; region: string };
}

export interface Forecast {
  id: string;
  product_id: string | null;
  region: string;
  forecast_date: string;
  predicted_demand: number;
  confidence: number | null;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  region: string | null;
  sku: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  type: string;
  from_location: string | null;
  to_location: string;
  product_id: string | null;
  quantity: number;
  reason: string | null;
  priority: string;
  ai_confidence: number | null;
  status: string;
  executed_at: string | null;
  created_at: string;
  products?: Product;
}

export interface Warehouse {
  id: string;
  name: string;
  region: string;
  capacity: number;
}

export interface Dealer {
  id: string;
  name: string;
  region: string;
  warehouse_id: string | null;
}

export interface ActivityLogEntry {
  id: string;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface PlannedAction {
  id: string;
  recommendation_id: string | null;
  action_type: string;
  product_id: string | null;
  from_location: string | null;
  to_location: string;
  quantity: number;
  planned_execution_date: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  created_at: string;
  products?: Product;
}

export interface InventoryProjection {
  id: string;
  product_id: string;
  warehouse_id: string;
  projected_date: string;
  current_quantity: number;
  planned_inbound: number;
  planned_outbound: number;
  forecasted_demand: number;
  projected_quantity: number;
  based_on_plan: boolean;
  created_at: string;
  products?: Product;
  warehouses?: { id: string; name: string; region: string };
}
