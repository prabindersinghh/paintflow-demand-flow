import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product, InventoryItem, Forecast, Alert, Recommendation, ActivityLogEntry, PlannedAction, InventoryProjection } from '@/lib/types';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callEdgeFunction(name: string, body?: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

export function useRealData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [plannedActions, setPlannedActions] = useState<PlannedAction[]>([]);
  const [projections, setProjections] = useState<InventoryProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAll = useCallback(async () => {
    const [
      { data: prods },
      { data: inv },
      { data: alts },
      { data: recs },
      { data: logs },
      { data: plans },
      { data: projs },
    ] = await Promise.all([
      supabase.from('products').select('*').order('sku'),
      supabase.from('inventory').select('*, products(*), warehouses(id, name, region)'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('recommendations').select('*, products(*)').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('planned_actions').select('*, products:product_id(*)').order('created_at', { ascending: false }),
      supabase.from('inventory_projection').select('*, products:product_id(*), warehouses:warehouse_id(id, name, region)').order('projected_date'),
    ]);

    if (prods) setProducts(prods as unknown as Product[]);
    if (inv) setInventory(inv as unknown as InventoryItem[]);
    if (alts) setAlerts(alts as unknown as Alert[]);
    if (recs) setRecommendations(recs as unknown as Recommendation[]);
    if (logs) setActivityLog(logs as unknown as ActivityLogEntry[]);
    if (plans) setPlannedActions(plans as unknown as PlannedAction[]);
    if (projs) setProjections(projs as unknown as InventoryProjection[]);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  // Stats — fetched directly from database via RPC
  const [stats, setStats] = useState({
    totalLitres: 0,
    totalValue: 0,
    totalSKUs: 0,
    stockoutRiskScore: 0,
    activeAlerts: 0,
    pendingPlans: 0,
    approvedPlans: 0,
    projectedRisks: 0,
  });

  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error || !data) return;
    const d = data as Record<string, number>;
    setStats({
      totalLitres: d.total_litres ?? 0,
      totalValue: d.total_value ?? 0,
      totalSKUs: d.total_skus ?? 0,
      stockoutRiskScore: d.stockout_risk_score ?? 0,
      activeAlerts: d.active_alerts ?? 0,
      pendingPlans: d.pending_plans ?? 0,
      approvedPlans: d.approved_plans ?? 0,
      projectedRisks: d.projected_risks ?? 0,
    });
  }, []);

  useEffect(() => {
    fetchAll();
    fetchStats();
  }, [fetchAll, fetchStats]);

  // Historical chart data
  const [historicalSales, setHistoricalSales] = useState<{ date: string; actual: number; predicted: number }[]>([]);

  const fetchHistoricalChart = useCallback(async () => {
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    
    const { data: sales } = await supabase
      .from('historical_sales')
      .select('sale_date, quantity')
      .gte('sale_date', thirtyAgo.toISOString().split('T')[0])
      .order('sale_date');

    if (!sales) return;

    const byDate: Record<string, number> = {};
    for (const s of sales) {
      byDate[s.sale_date] = (byDate[s.sale_date] || 0) + s.quantity;
    }

    const { data: fcData } = await supabase
      .from('forecasts')
      .select('forecast_date, predicted_demand')
      .gte('forecast_date', thirtyAgo.toISOString().split('T')[0])
      .order('forecast_date');

    const fcByDate: Record<string, number> = {};
    if (fcData) {
      for (const f of fcData) {
        fcByDate[f.forecast_date] = (fcByDate[f.forecast_date] || 0) + f.predicted_demand;
      }
    }

    const allDates = [...new Set([...Object.keys(byDate), ...Object.keys(fcByDate)])].sort();
    const chartData = allDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: byDate[date] || 0,
      predicted: fcByDate[date] || 0,
    }));

    setHistoricalSales(chartData);
  }, []);

  useEffect(() => {
    fetchHistoricalChart();
  }, [fetchHistoricalChart]);

  // Regional demand
  const [regionalDemand, setRegionalDemand] = useState<{ region: string; demand: number; growth: number }[]>([]);
  
  const fetchRegionalDemand = useCallback(async () => {
    const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
    const fourteenAgo = new Date(); fourteenAgo.setDate(fourteenAgo.getDate() - 14);

    const { data: sales } = await supabase
      .from('historical_sales')
      .select('region, quantity, sale_date')
      .gte('sale_date', fourteenAgo.toISOString().split('T')[0]);

    if (!sales) return;

    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const result = regions.map(region => {
      const regionSales = sales.filter(s => s.region === region);
      const recent = regionSales.filter(s => new Date(s.sale_date) >= sevenAgo).reduce((s, r) => s + r.quantity, 0);
      const previous = regionSales.filter(s => new Date(s.sale_date) < sevenAgo).reduce((s, r) => s + r.quantity, 0);
      const growth = previous > 0 ? Math.round(((recent - previous) / previous) * 1000) / 10 : 0;
      return { region, demand: recent, growth };
    });

    setRegionalDemand(result);
  }, []);

  useEffect(() => {
    fetchRegionalDemand();
  }, [fetchRegionalDemand]);

  // SKU velocity
  const [skuVelocity, setSKUVelocity] = useState<{ sku: string; name: string; velocity: number; trend: 'up' | 'down' | 'stable' }[]>([]);

  const fetchSKUVelocity = useCallback(async () => {
    const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
    const fourteenAgo = new Date(); fourteenAgo.setDate(fourteenAgo.getDate() - 14);

    const { data: sales } = await supabase
      .from('historical_sales')
      .select('product_id, quantity, sale_date')
      .gte('sale_date', fourteenAgo.toISOString().split('T')[0]);

    if (!sales || products.length === 0) return;

    const velocity = products.slice(0, 10).map(p => {
      const pSales = sales.filter(s => s.product_id === p.id);
      const recent = pSales.filter(s => new Date(s.sale_date) >= sevenAgo).reduce((s, r) => s + r.quantity, 0);
      const previous = pSales.filter(s => new Date(s.sale_date) < sevenAgo).reduce((s, r) => s + r.quantity, 0);
      const trend: 'up' | 'down' | 'stable' = recent > previous * 1.1 ? 'up' : recent < previous * 0.9 ? 'down' : 'stable';
      return { sku: p.sku, name: p.name, velocity: recent, trend };
    });

    setSKUVelocity(velocity);
  }, [products]);

  useEffect(() => {
    if (products.length > 0) fetchSKUVelocity();
  }, [products, fetchSKUVelocity]);

  // Actions
  const runForecast = useCallback(async (userName?: string) => {
    toast.loading('Running forecast engine...');
    const result = await callEdgeFunction('run-forecast', { user_name: userName || 'Admin' });
    toast.dismiss();
    if (result.success) {
      toast.success(`Generated ${result.forecasts_generated} forecasts`);
      await fetchAll();
      await fetchStats();
      await fetchHistoricalChart();
    } else {
      toast.error(result.error || 'Forecast failed');
    }
    return result;
  }, [fetchAll, fetchStats, fetchHistoricalChart]);

  const runRecommendations = useCallback(async (userName?: string) => {
    toast.loading('Generating plan & projections...');
    const result = await callEdgeFunction('run-recommendations', { user_name: userName || 'Admin' });
    toast.dismiss();
    if (result.success) {
      toast.success(`Generated ${result.recommendations_generated} planned actions & ${result.projections_generated} projections`);
      await fetchAll();
      await fetchStats();
    } else {
      toast.error(result.error || 'Planning engine failed');
    }
    return result;
  }, [fetchAll, fetchStats]);

  const evaluateAlerts = useCallback(async () => {
    const result = await callEdgeFunction('evaluate-alerts');
    if (result.success) {
      await fetchAll();
      await fetchStats();
    }
    return result;
  }, [fetchAll, fetchStats]);

  const approveRecommendation = useCallback(async (recId: string, userName?: string) => {
    const result = await callEdgeFunction('approve-action', {
      action: 'approve',
      recommendation_id: recId,
      user_name: userName || 'Admin',
    });
    if (result.success) {
      toast.success('Plan approved — awaiting execution');
      await fetchAll();
      await fetchStats();
    } else {
      toast.error(result.error || 'Approval failed');
    }
    return result;
  }, [fetchAll, fetchStats]);

  const rejectRecommendation = useCallback(async (recId: string, userName?: string) => {
    const result = await callEdgeFunction('approve-action', {
      action: 'reject',
      recommendation_id: recId,
      user_name: userName || 'Admin',
    });
    if (result.success) {
      toast.success('Recommendation rejected');
      await fetchAll();
      await fetchStats();
    } else {
      toast.error(result.error || 'Rejection failed');
    }
    return result;
  }, [fetchAll, fetchStats]);

  const executePlan = useCallback(async (userName?: string) => {
    toast.loading('Executing approved plans...');
    const result = await callEdgeFunction('execute-plan', { user_name: userName || 'Admin' });
    toast.dismiss();
    if (result.success) {
      toast.success(result.message || `Executed ${result.executed} actions`);
      await fetchAll();
      await fetchStats();
    } else {
      toast.error(result.error || 'Plan execution failed');
    }
    return result;
  }, [fetchAll, fetchStats]);

  const placeDealerOrder = useCallback(async (recId: string, userName?: string) => {
    return approveRecommendation(recId, userName);
  }, [approveRecommendation]);

  return {
    products,
    inventory,
    alerts,
    recommendations,
    forecasts,
    activityLog,
    plannedActions,
    projections,
    historicalSales,
    regionalDemand,
    skuVelocity,
    stats,
    loading,
    lastUpdated,
    // Actions
    runForecast,
    runRecommendations,
    evaluateAlerts,
    approveRecommendation,
    rejectRecommendation,
    executePlan,
    placeDealerOrder,
    refresh: async () => { await fetchAll(); await fetchStats(); },
  };
}
