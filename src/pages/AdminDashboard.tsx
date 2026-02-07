import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSeed } from '@/hooks/useAutoSeed';
import { useRealData } from '@/hooks/useRealData';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import AdminOverview from './admin/AdminOverview';
import InventoryPage from './admin/InventoryPage';
import ForecastsPage from './admin/ForecastsPage';
import TransfersPage from './admin/TransfersPage';
import AlertsPage from './admin/AlertsPage';
import AnalyticsPage from './admin/AnalyticsPage';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { loading, refresh } = useRealData();
  useAutoSeed(refresh);

  const location = useLocation();
  const subPath = location.pathname.replace('/admin', '').replace(/^\//, '');

  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name || 'Admin'}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
        </div>
      </DashboardLayout>
    );
  }

  const renderPage = () => {
    switch (subPath) {
      case 'inventory': return <InventoryPage />;
      case 'forecasts': return <ForecastsPage />;
      case 'transfers': return <TransfersPage />;
      case 'alerts': return <AlertsPage />;
      case 'analytics': return <AnalyticsPage />;
      default: return <AdminOverview />;
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.name || 'Admin'}>
      {renderPage()}
    </DashboardLayout>
  );
}
