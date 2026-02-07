import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types';
import { Droplets, ArrowRight, Shield, Truck, ShoppingCart, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_CONFIG: Record<UserRole, { icon: typeof Shield; label: string; desc: string; path: string; color: string }> = {
  admin: { icon: Shield, label: 'Company Admin', desc: 'Full network overview, forecasting & analytics', path: '/admin', color: 'bg-primary' },
  distributor: { icon: Truck, label: 'Distributor', desc: 'Warehouse management & stock transfers', path: '/distributor', color: 'bg-chart-2' },
  dealer: { icon: ShoppingCart, label: 'Dealer', desc: 'Smart orders & demand predictions', path: '/dealer', color: 'bg-chart-3' },
  viewer: { icon: Eye, label: 'Viewer (Demo)', desc: 'Read-only system intelligence overview', path: '/viewer', color: 'bg-chart-4' },
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<'select' | 'login' | 'signup'>('select');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  if (user) {
    const path = ROLE_CONFIG[user.role]?.path || '/viewer';
    navigate(path, { replace: true });
    return null;
  }

  const handleLogin = async () => {
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      // Role will be loaded by auth context, redirect after
      toast.success('Signed in successfully');
      // Wait briefly for auth state to update
      setTimeout(() => {
        navigate(ROLE_CONFIG[selectedRole]?.path || '/admin');
      }, 500);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setSubmitting(true);
    const { error } = await signUp(email, password, name, selectedRole);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      // Assign role via edge function
      try {
        // We need to get the user ID - signUp should have set the session
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await fetch(`${SUPABASE_URL}/functions/v1/assign-role`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ user_id: authUser.id, role: selectedRole, name }),
          });
        }
      } catch (e) {
        console.error('Role assignment error:', e);
      }
      toast.success('Account created! Please check your email to verify, then sign in.');
      setMode('login');
    }
  };

  if (mode === 'login' || mode === 'signup') {
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
              <span className="text-xs text-sidebar-foreground">Real-time demand forecasting per SKU per region</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs text-sidebar-foreground">Intelligent stock transfer recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs text-sidebar-foreground">Persistent data — every action is recorded</span>
            </div>
          </div>
        </div>

        {/* Right - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                <Droplets className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">PaintFlow.ai</span>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {mode === 'login' ? 'Enter your credentials to access the dashboard' : 'Set up your account to get started'}
            </p>

            <div className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Rajesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Role</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
                    >
                      {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                        <option key={role} value={role}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
                  placeholder="admin@paintflow.ai"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignUp())}
                />
              </div>

              <button
                onClick={mode === 'login' ? handleLogin : handleSignUp}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-accent hover:underline"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setMode('select')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back to role selection (demo mode)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role selection (demo mode - still works for quick access)
  return (
    <div className="min-h-screen bg-background flex">
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

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
              <Droplets className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">PaintFlow.ai</span>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-1">Welcome to PaintFlow.ai</h3>
          <p className="text-sm text-muted-foreground mb-6">Sign in or explore a demo dashboard</p>

          <button
            onClick={() => setMode('login')}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent/5 p-4 text-sm font-semibold text-foreground hover:bg-accent/10 transition-all"
          >
            Sign In / Create Account
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-xs text-muted-foreground mb-3 text-center">— or explore as a demo viewer —</p>

          <div className="space-y-3">
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.admin][]).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => navigate(config.path)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-accent/40 hover:bg-muted/50"
                >
                  <div className={`rounded-lg ${config.color} p-2.5`}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Data persists across sessions — all changes are saved to the database
          </p>
        </div>
      </div>
    </div>
  );
}
