import { useState, useEffect, useCallback } from 'react';
import {
  generateInventory,
  generateForecasts,
  generateAlerts,
  generateRecommendations,
  getNetworkStats,
  generateHistoricalSales,
  getRegionalDemand,
  getSKUVelocity,
  type InventoryItem,
  type Forecast,
  type Alert,
  type Recommendation,
} from '@/lib/mock-data';

export function useLiveData() {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => generateInventory());
  const [forecasts] = useState<Forecast[]>(() => generateForecasts());
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts());
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => generateRecommendations());
  const [historicalSales, setHistoricalSales] = useState(() => generateHistoricalSales());
  const [regionalDemand, setRegionalDemand] = useState(() => getRegionalDemand());
  const [skuVelocity, setSKUVelocity] = useState(() => getSKUVelocity());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate live inventory changes
  useEffect(() => {
    const interval = setInterval(() => {
      setInventory(prev => prev.map(item => ({
        ...item,
        quantity: Math.max(0, item.quantity + Math.floor((Math.random() - 0.55) * 10)),
        lastUpdated: new Date(),
      })));
      setHistoricalSales(generateHistoricalSales());
      setRegionalDemand(getRegionalDemand());
      setSKUVelocity(getSKUVelocity());
      setLastUpdated(new Date());
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const stats = getNetworkStats(inventory);

  const approveRecommendation = useCallback((recId: string) => {
    setRecommendations(prev => prev.map(r =>
      r.id === recId ? { ...r, status: 'approved' as const } : r
    ));
    // Simulate inventory update on approval
    setInventory(prev => {
      const rec = recommendations.find(r => r.id === recId);
      if (!rec) return prev;
      return prev.map(item => {
        if (item.productId === rec.productId) {
          return { ...item, quantity: item.quantity + rec.quantity, lastUpdated: new Date() };
        }
        return item;
      });
    });
    // Add success alert
    setAlerts(prev => [{
      id: `ALT-${Date.now()}`,
      type: 'seasonal' as const,
      severity: 'info' as const,
      title: 'Transfer Approved',
      description: `Stock transfer recommendation ${recId} approved and inventory updated.`,
      region: 'Central' as const,
      timestamp: new Date(),
    }, ...prev]);
  }, [recommendations]);

  const rejectRecommendation = useCallback((recId: string) => {
    setRecommendations(prev => prev.map(r =>
      r.id === recId ? { ...r, status: 'rejected' as const } : r
    ));
  }, []);

  return {
    inventory,
    forecasts,
    alerts,
    recommendations,
    historicalSales,
    regionalDemand,
    skuVelocity,
    stats,
    lastUpdated,
    approveRecommendation,
    rejectRecommendation,
  };
}
