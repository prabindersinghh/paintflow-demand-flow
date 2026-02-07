// PaintFlow.ai Mock Data Engine
// Realistic paint industry data with simulated live updates

export const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const;
export type Region = typeof REGIONS[number];

export type UserRole = 'admin' | 'distributor' | 'dealer' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  region: Region;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  color: string;
  unitPrice: number;
  minStock: number;
}

export interface InventoryItem {
  productId: string;
  warehouseId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface Forecast {
  productId: string;
  region: Region;
  date: string;
  predictedDemand: number;
  confidence: number;
}

export interface Alert {
  id: string;
  type: 'stockout_risk' | 'overstock' | 'demand_spike' | 'seasonal';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  region: Region;
  sku?: string;
  timestamp: Date;
}

export interface Recommendation {
  id: string;
  type: 'transfer' | 'reorder' | 'order';
  from?: string;
  to: string;
  productId: string;
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  aiConfidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Warehouse {
  id: string;
  name: string;
  region: Region;
  capacity: number;
}

export interface Dealer {
  id: string;
  name: string;
  region: Region;
  warehouseId: string;
}

// Demo users
export const DEMO_USERS: User[] = [
  { id: '1', name: 'Rajesh Kumar', email: 'admin@paintflow.ai', role: 'admin', company: 'PaintFlow Manufacturing', region: 'Central' },
  { id: '2', name: 'Priya Sharma', email: 'distributor@paintflow.ai', role: 'distributor', company: 'Northern Paints Dist.', region: 'North' },
  { id: '3', name: 'Amit Patel', email: 'dealer@paintflow.ai', role: 'dealer', company: 'Patel Paint House', region: 'West' },
  { id: '4', name: 'Demo Viewer', email: 'viewer@paintflow.ai', role: 'viewer', company: 'PaintFlow', region: 'Central' },
];

const PAINT_CATEGORIES = ['Interior', 'Exterior', 'Industrial', 'Wood Finish', 'Primer', 'Specialty'];
const PAINT_COLORS = ['Arctic White', 'Royal Blue', 'Forest Green', 'Sunset Orange', 'Charcoal Grey', 'Ivory Cream', 'Ruby Red', 'Ocean Teal', 'Golden Sand', 'Midnight Black'];
const PAINT_TYPES = ['Emulsion', 'Enamel', 'Distemper', 'Texture', 'Lacquer', 'Epoxy'];

export const PRODUCTS: Product[] = Array.from({ length: 30 }, (_, i) => ({
  id: `SKU-${String(i + 1).padStart(3, '0')}`,
  sku: `PF-${PAINT_CATEGORIES[i % 6].substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
  name: `${PAINT_COLORS[i % 10]} ${PAINT_TYPES[i % 6]}`,
  category: PAINT_CATEGORIES[i % 6],
  color: PAINT_COLORS[i % 10],
  unitPrice: Math.round((150 + Math.random() * 850) * 100) / 100,
  minStock: 50 + Math.floor(Math.random() * 150),
}));

export const WAREHOUSES: Warehouse[] = [
  { id: 'WH-001', name: 'Central Hub Warehouse', region: 'Central', capacity: 50000 },
  { id: 'WH-002', name: 'Northern Distribution Center', region: 'North', capacity: 35000 },
];

export const DEALERS: Dealer[] = Array.from({ length: 10 }, (_, i) => ({
  id: `DLR-${String(i + 1).padStart(3, '0')}`,
  name: [
    'Patel Paint House', 'Singh Color World', 'Gupta Hardware & Paints',
    'Sharma Decor Hub', 'Reddy Paint Mart', 'Nair Color Studio',
    'Joshi Paint Palace', 'Das Home Finishes', 'Mehta Paint Pro',
    'Khan Color Corner'
  ][i],
  region: REGIONS[i % 5],
  warehouseId: i < 5 ? 'WH-001' : 'WH-002',
}));

// Generate inventory with realistic quantities
export function generateInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const wh of WAREHOUSES) {
    for (const product of PRODUCTS) {
      items.push({
        productId: product.id,
        warehouseId: wh.id,
        quantity: Math.floor(Math.random() * 500) + 20,
        lastUpdated: new Date(),
      });
    }
  }
  return items;
}

// Seasonality multipliers by month
const SEASONALITY: Record<number, number> = {
  0: 0.7, 1: 0.75, 2: 0.9, 3: 1.2, 4: 1.3, 5: 1.1,
  6: 0.8, 7: 0.85, 8: 1.0, 9: 1.4, 10: 1.5, 11: 0.9,
};

// Generate 30-day forecast
export function generateForecasts(): Forecast[] {
  const forecasts: Forecast[] = [];
  const today = new Date();
  const month = today.getMonth();
  const seasonality = SEASONALITY[month] || 1;

  for (const region of REGIONS) {
    for (const product of PRODUCTS.slice(0, 15)) {
      const baseDemand = 20 + Math.random() * 80;
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        const weekdayFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
        const noise = 0.85 + Math.random() * 0.3;
        const trend = 1 + (day * 0.005);

        forecasts.push({
          productId: product.id,
          region,
          date: date.toISOString().split('T')[0],
          predictedDemand: Math.round(baseDemand * seasonality * weekdayFactor * noise * trend),
          confidence: Math.round((75 + Math.random() * 20) * 10) / 10,
        });
      }
    }
  }
  return forecasts;
}

// Generate alerts
export function generateAlerts(): Alert[] {
  const alertTemplates: Omit<Alert, 'id' | 'timestamp'>[] = [
    { type: 'stockout_risk', severity: 'critical', title: 'Critical Stockout Risk', description: 'Arctic White Emulsion stock below safety threshold in North region. Expected stockout in 3 days.', region: 'North', sku: 'PF-INT-001' },
    { type: 'demand_spike', severity: 'warning', title: 'Demand Spike Detected', description: 'Unusual 40% increase in Royal Blue Enamel demand in West region. Likely driven by festival season.', region: 'West', sku: 'PF-EXT-002' },
    { type: 'overstock', severity: 'info', title: 'Overstock Alert', description: 'Charcoal Grey Distemper exceeds optimal levels by 180% in Central warehouse. Consider redistribution.', region: 'Central', sku: 'PF-IND-005' },
    { type: 'seasonal', severity: 'warning', title: 'Seasonal Demand Approaching', description: 'Monsoon season approaching. Historical data suggests 35% drop in exterior paint demand across South region.', region: 'South' },
    { type: 'stockout_risk', severity: 'critical', title: 'Reorder Point Breached', description: 'Forest Green Texture paint fell below minimum stock level at Northern Distribution Center.', region: 'North', sku: 'PF-WOO-003' },
    { type: 'demand_spike', severity: 'warning', title: 'Regional Surge', description: 'Construction boom in East region driving 60% higher primer demand. AI recommends preemptive stock increase.', region: 'East' },
    { type: 'overstock', severity: 'info', title: 'Dead Stock Warning', description: 'Midnight Black Lacquer showing zero movement for 45 days in South region. Consider promotional pricing.', region: 'South', sku: 'PF-SPE-010' },
    { type: 'seasonal', severity: 'info', title: 'Festival Season Prep', description: 'Diwali season in 6 weeks. AI predicts 55% increase in interior paint demand. Pre-position stock now.', region: 'Central' },
  ];

  return alertTemplates.map((t, i) => ({
    ...t,
    id: `ALT-${String(i + 1).padStart(3, '0')}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
  }));
}

// Generate recommendations
export function generateRecommendations(): Recommendation[] {
  return [
    { id: 'REC-001', type: 'transfer', from: 'Central Hub Warehouse', to: 'Northern Distribution Center', productId: 'SKU-001', quantity: 200, reason: 'High stockout risk in North. Central has 340% excess.', priority: 'high', aiConfidence: 94, status: 'pending' },
    { id: 'REC-002', type: 'reorder', to: 'Central Hub Warehouse', productId: 'SKU-003', quantity: 500, reason: 'Forecasted demand exceeds current stock by day 12.', priority: 'high', aiConfidence: 91, status: 'pending' },
    { id: 'REC-003', type: 'transfer', from: 'Central Hub Warehouse', to: 'Northern Distribution Center', productId: 'SKU-007', quantity: 150, reason: 'Seasonal demand surge expected in North region.', priority: 'medium', aiConfidence: 87, status: 'pending' },
    { id: 'REC-004', type: 'order', to: 'Patel Paint House', productId: 'SKU-002', quantity: 75, reason: 'High regional demand next week. Stock will deplete in 5 days.', priority: 'high', aiConfidence: 92, status: 'pending' },
    { id: 'REC-005', type: 'order', to: 'Singh Color World', productId: 'SKU-005', quantity: 40, reason: 'Festival season approaching. Historical sales spike 45%.', priority: 'medium', aiConfidence: 85, status: 'pending' },
    { id: 'REC-006', type: 'reorder', to: 'Northern Distribution Center', productId: 'SKU-012', quantity: 300, reason: 'Current velocity will exhaust stock in 8 days.', priority: 'medium', aiConfidence: 88, status: 'pending' },
    { id: 'REC-007', type: 'transfer', from: 'Northern Distribution Center', to: 'Central Hub Warehouse', productId: 'SKU-010', quantity: 100, reason: 'Dead stock in North. Demand exists in Central.', priority: 'low', aiConfidence: 79, status: 'pending' },
    { id: 'REC-008', type: 'order', to: 'Gupta Hardware & Paints', productId: 'SKU-001', quantity: 60, reason: 'New construction projects driving demand. Order before stockout.', priority: 'high', aiConfidence: 93, status: 'pending' },
  ];
}

// Aggregate stats
export function getNetworkStats(inventory: InventoryItem[]) {
  const totalUnits = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = inventory.filter(i => {
    const product = PRODUCTS.find(p => p.id === i.productId);
    return product && i.quantity < product.minStock;
  }).length;
  const totalValue = inventory.reduce((sum, i) => {
    const product = PRODUCTS.find(p => p.id === i.productId);
    return sum + (product ? i.quantity * product.unitPrice : 0);
  }, 0);

  return {
    totalUnits,
    totalValue,
    totalSKUs: PRODUCTS.length,
    lowStockCount,
    stockoutRiskScore: Math.round((lowStockCount / inventory.length) * 100),
    forecastAccuracy: 87 + Math.round(Math.random() * 8),
    activeAlerts: 5 + Math.floor(Math.random() * 4),
  };
}

// Generate historical sales for charts
export function generateHistoricalSales(days: number = 30): { date: string; actual: number; predicted: number }[] {
  const data: { date: string; actual: number; predicted: number }[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const base = 800 + Math.sin(i / 7 * Math.PI) * 200;
    const actual = Math.round(base + (Math.random() - 0.5) * 300);
    const predicted = Math.round(base + (Math.random() - 0.5) * 100);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual,
      predicted,
    });
  }
  return data;
}

// Regional demand data for heatmap
export function getRegionalDemand(): { region: Region; demand: number; growth: number }[] {
  return REGIONS.map(region => ({
    region,
    demand: Math.round(5000 + Math.random() * 15000),
    growth: Math.round((Math.random() * 40 - 10) * 10) / 10,
  }));
}

// SKU velocity data
export function getSKUVelocity(): { sku: string; name: string; velocity: number; trend: 'up' | 'down' | 'stable' }[] {
  return PRODUCTS.slice(0, 10).map(p => ({
    sku: p.sku,
    name: p.name,
    velocity: Math.round(Math.random() * 100),
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
  }));
}
