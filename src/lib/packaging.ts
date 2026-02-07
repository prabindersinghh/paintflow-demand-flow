// Paint packaging utility functions
// All inventory quantities in the DB represent individual cans/packs.
// Each product has a pack_size_litres (1, 4, 10, or 20).

import type { Product } from './types';

export const PACK_LABELS: Record<number, string> = {
  1: '1L can',
  4: '4L can',
  10: '10L bucket',
  20: '20L drum',
};

/** Convert raw quantity (number of packs) to total litres */
export function toLitres(quantity: number, product: Product | undefined | null): number {
  if (!product) return quantity;
  return quantity * (product.pack_size_litres || 1);
}

/** Format quantity as litres string */
export function formatLitres(quantity: number, product?: Product | null): string {
  const litres = toLitres(quantity, product);
  return `${litres.toLocaleString()}L`;
}

/** Format as "860 Litres (~86 10L cans)" */
export function formatPackaging(quantity: number, product?: Product | null): string {
  if (!product) return `${quantity.toLocaleString()} units`;
  const packSize = product.pack_size_litres || 1;
  const litres = quantity * packSize;
  const packLabel = PACK_LABELS[packSize] || `${packSize}L`;
  return `${litres.toLocaleString()} Litres (~${quantity.toLocaleString()} ${packLabel}s)`;
}

/** Short format: "860L (86×10L)" */
export function formatPackagingShort(quantity: number, product?: Product | null): string {
  if (!product) return `${quantity.toLocaleString()}`;
  const packSize = product.pack_size_litres || 1;
  const litres = quantity * packSize;
  return `${litres.toLocaleString()}L (${quantity}×${packSize}L)`;
}

/** Calculate total litres from inventory items */
export function totalLitres(
  items: { quantity: number; products?: Product | null; product_id?: string }[],
  productsLookup?: Product[]
): number {
  return items.reduce((sum, item) => {
    const prod = item.products || productsLookup?.find(p => p.id === item.product_id);
    return sum + toLitres(item.quantity, prod);
  }, 0);
}

/** Calculate total value (litres × per-litre price) */
export function totalValue(
  items: { quantity: number; products?: Product | null; product_id?: string }[],
  productsLookup?: Product[]
): number {
  return items.reduce((sum, item) => {
    const prod = item.products || productsLookup?.find(p => p.id === item.product_id);
    if (!prod) return sum;
    // unit_price is per pack, so value = quantity * unit_price
    return sum + item.quantity * prod.unit_price;
  }, 0);
}
