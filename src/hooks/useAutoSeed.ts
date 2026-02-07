import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Auto-seeds the database with demo data if it detects
 * the planned_actions table is empty (indicates fresh or unseeded state).
 * Chains: seed → forecast → recommendations → alerts.
 */
export function useAutoSeed(onComplete?: () => void) {
  const seeding = useRef(false);

  useEffect(() => {
    if (seeding.current) return;

    const checkAndSeed = async () => {
      try {
        // Quick check: if planned_actions is empty AND inventory_movements is empty,
        // the planning system hasn't been initialized
        const [{ count: planCount }, { count: moveCount }] = await Promise.all([
          supabase.from('planned_actions').select('*', { count: 'exact', head: true }),
          supabase.from('inventory_movements').select('*', { count: 'exact', head: true }),
        ]);

        if ((planCount ?? 0) > 0 || (moveCount ?? 0) > 0) {
          return; // Already seeded
        }

        // Also check if we have products (master data must exist)
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if ((prodCount ?? 0) === 0) {
          return; // No master data, can't seed
        }

        seeding.current = true;

        const toastId = toast.loading('Initializing demo data — seeding 90 days of history, forecasts, and plans...', {
          duration: 60000,
        });

        const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ chain_forecast: true }),
        });

        const result = await res.json();
        toast.dismiss(toastId);

        if (result.success) {
          toast.success(`Demo initialized: ${result.seeded.historical_sales} sales records, forecasts & plans generated`, {
            duration: 5000,
          });
          onComplete?.();
        } else {
          toast.error(`Seed failed: ${result.error}`);
        }
      } catch (err) {
        console.error('Auto-seed error:', err);
      }
    };

    checkAndSeed();
  }, [onComplete]);
}
