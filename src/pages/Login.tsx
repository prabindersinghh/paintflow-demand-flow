import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_USERS, type UserRole } from '@/lib/mock-data';
import { Droplets, ArrowRight, Shield, Truck, ShoppingCart, Eye } from 'lucide-react';

const ROLE_CONFIG = {
  admin: { icon: Shield, label: 'Company Admin', desc: 'Full network overview, forecasting & analytics', path: '/admin', color: 'bg-primary' },
  distributor: { icon: Truck, label: 'Distributor', desc: 'Warehouse management & stock transfers', path: '/distributor', color: 'bg-chart-2' },
  dealer: { icon: ShoppingCart, label: 'Dealer', desc: 'Smart orders & demand predictions', path: '/dealer', color: 'bg-chart-3' },
  viewer: { icon: Eye, label: 'Viewer (Demo)', desc: 'Read-only system intelligence overview', path: '/viewer', color: 'bg-chart-4' },
};

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    localStorage.setItem('paintflow_role', role);
    const user = DEMO_USERS.find(u => u.role === role);
    if (user) localStorage.setItem('paintflow_user', JSON.stringify(user));
    navigate(ROLE_CONFIG[role].path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[480px] sidebar-gradient flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Droplets className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground tracking-tight">PaintFlow</h1>
              <span className="text-xs font-semibold text-accent">.ai</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground leading-tight mb-4">
            AI-Driven Demand Forecasting & Inventory Orchestration
          </h2>
          <p className="text-sm text-sidebar-foreground leading-relaxed">
            Predict demand, prevent stockouts, and optimize inventory across your entire paint supply chain network.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs text-sidebar-foreground">30-day demand forecasting per SKU per region</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs text-sidebar-foreground">Intelligent stock transfer recommendations</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs text-sidebar-foreground">Real-time stockout risk detection</span>
          </div>
        </div>
      </div>

      {/* Right - Role Selection */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
              <Droplets className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">PaintFlow.ai</span>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-1">Select Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-6">Choose a role to explore the platform</p>

          <div className="space-y-3">
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.admin][]).map(([role, config]) => {
              const Icon = config.icon;
              const user = DEMO_USERS.find(u => u.role === role);
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    handleLogin(role);
                  }}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-md'
                      : 'border-border hover:border-accent/40 hover:bg-muted/50'
                  }`}
                >
                  <div className={`rounded-lg ${config.color} p-2.5`}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.desc}</p>
                    {user && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Demo: {user.name} • {user.company}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Demo mode — all data is simulated and updates in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
