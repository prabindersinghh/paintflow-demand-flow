import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useRealData } from '@/hooks/useRealData';
import { Warehouse as WarehouseIcon, Package } from 'lucide-react';
import { toLitres } from '@/lib/packaging';
import type { InventoryItem } from '@/lib/types';

function groupByWarehouse(inventory: InventoryItem[]) {
  const map: Record<string, { name: string; region: string; items: InventoryItem[]; totalLitres: number }> = {};
  for (const item of inventory) {
    const wh = item.warehouses;
    const key = item.warehouse_id;
    if (!map[key]) {
      map[key] = { name: wh?.name || key, region: wh?.region || '—', items: [], totalLitres: 0 };
    }
    map[key].items.push(item);
    map[key].totalLitres += toLitres(item.quantity, item.products);
  }
  return Object.entries(map).map(([id, data]) => ({ id, ...data }));
}

export default function InventoryPage() {
  const { inventory } = useRealData();
  const warehouses = groupByWarehouse(inventory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Warehouse Inventory</h2>
        <p className="text-xs text-muted-foreground">Current stock levels by warehouse • Read-only view from inventory database</p>
      </div>

      {inventory.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            title="No inventory data"
            message="Run the Planning Engine to seed inventory and generate insights."
            icon={<Package className="h-6 w-6 text-accent" />}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {warehouses.map(wh => (
              <div key={wh.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <WarehouseIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{wh.name}</p>
                    <p className="text-[10px] text-muted-foreground">Region: {wh.region}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-card-foreground">{(wh.totalLitres / 1000).toFixed(1)}K L</p>
                    <p className="text-[10px] text-muted-foreground">{wh.items.length} SKUs</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <InventoryTable inventory={inventory} />
        </>
      )}
    </div>
  );
}
