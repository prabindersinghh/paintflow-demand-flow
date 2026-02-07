import type { InventoryItem, Product } from '@/lib/types';

interface InventoryTableProps {
  inventory: InventoryItem[];
  warehouseFilter?: string;
  compact?: boolean;
}

export function InventoryTable({ inventory, warehouseFilter, compact }: InventoryTableProps) {
  const filtered = warehouseFilter
    ? inventory.filter(i => i.warehouse_id === warehouseFilter)
    : inventory;

  // Group by product
  const productMap: Record<string, { product: Product; totalQty: number; isLow: boolean; isDead: boolean }> = {};
  
  for (const item of filtered) {
    const prod = item.products;
    if (!prod) continue;
    if (!productMap[prod.id]) {
      productMap[prod.id] = { product: prod, totalQty: 0, isLow: false, isDead: false };
    }
    productMap[prod.id].totalQty += item.quantity;
  }

  const grouped = Object.values(productMap).map(entry => {
    entry.isLow = entry.totalQty < entry.product.min_stock;
    entry.isDead = entry.totalQty > entry.product.min_stock * 4;
    return entry;
  }).sort((a, b) => a.totalQty - b.totalQty);

  const displayItems = compact ? grouped.slice(0, 10) : grouped;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-card-foreground">
          Inventory Status {compact && <span className="text-muted-foreground font-normal">• Top 10 at risk</span>}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Min</th>
              <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map(({ product, totalQty, isLow, isDead }) => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{product.sku}</td>
                <td className="px-4 py-2.5 font-medium text-card-foreground">{product.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{product.category}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${isLow ? 'text-destructive' : 'text-card-foreground'}`}>
                  {totalQty.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">{product.min_stock}</td>
                <td className="px-4 py-2.5 text-center">
                  {isLow ? (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      Low Stock
                    </span>
                  ) : isDead ? (
                    <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                      Overstock
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                      Optimal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
