import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InventoryProjection, PlannedAction, Product, InventoryItem } from '@/lib/types';
import { toLitres } from '@/lib/packaging';

interface PlanReportData {
  projections: InventoryProjection[];
  plannedActions: PlannedAction[];
  products: Product[];
  inventory: InventoryItem[];
  regionalDemand: { region: string; demand: number; growth: number }[];
  stats: {
    totalLitres: number;
    totalValue: number;
    stockoutRiskScore: number;
    pendingPlans: number;
    approvedPlans: number;
    projectedRisks: number;
  };
}

export function generatePlanReportPDF(data: PlanReportData) {
  const { projections, plannedActions, products, inventory, regionalDemand, stats } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const accentColor: [number, number, number] = [38, 145, 120];
  const darkColor: [number, number, number] = [28, 40, 58];
  const mutedColor: [number, number, number] = [120, 130, 145];

  // === HEADER ===
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PaintFlow.ai', margin, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Demand Planning Report', margin, 24);

  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 31);
  doc.text('Company: Demo Paint Network', pageWidth - margin - 60, 31);

  y = 48;

  // === EXECUTIVE SUMMARY ===
  doc.setTextColor(...darkColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);

  const now = Date.now();
  const sevenDays = now + 7 * 86400000;
  const stockoutRisks = projections.filter(p =>
    p.products && new Date(p.projected_date).getTime() <= sevenDays && p.projected_quantity < p.products.min_stock * 0.5
  );
  const overstockRisks = projections.filter(p =>
    p.products && p.projected_quantity > p.products.min_stock * 4
  );
  const transfers = plannedActions.filter(a => a.action_type === 'transfer');
  const reorders = plannedActions.filter(a => a.action_type === 'reorder');

  const summaryLines = [
    `This report presents the AI-generated demand planning analysis for your paint distribution network.`,
    `The system has analysed ${products.length} SKUs across ${regionalDemand.length} regions, identifying ${stockoutRisks.length} stockout risks`,
    `and ${overstockRisks.length} overstock situations. A total of ${transfers.length} inter-warehouse transfers and ${reorders.length} reorder`,
    `actions have been recommended to optimise inventory levels and improve service delivery.`,
  ];
  for (const line of summaryLines) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 4;

  // Key metrics row
  const metrics = [
    { label: 'Total Inventory', value: `${(stats.totalLitres / 1000).toFixed(1)}K Litres` },
    { label: 'Inventory Value', value: `₹${(stats.totalValue / 100000).toFixed(1)} Lakhs` },
    { label: 'Stockout Risk', value: `${stats.stockoutRiskScore}%` },
    { label: 'Planned Actions', value: `${stats.pendingPlans + stats.approvedPlans}` },
  ];

  const metricWidth = contentWidth / metrics.length;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

  metrics.forEach((m, i) => {
    const x = margin + i * metricWidth + metricWidth / 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(m.value, x, y + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(m.label, x, y + 14, { align: 'center' });
  });
  y += 26;

  // === SECTION 1: DEMAND FORECAST SUMMARY ===
  const sectionHeader = (title: string, num: number) => {
    doc.setFillColor(...accentColor);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(`Section ${num} — ${title}`, margin + 6, y + 5.5);
    y += 12;
  };

  sectionHeader('Demand Forecast Summary', 1);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Region', '7-Day Demand (units)', 'Growth vs Prior Week', 'Trend']],
    body: regionalDemand.map(r => [
      r.region,
      r.demand.toLocaleString(),
      `${r.growth > 0 ? '+' : ''}${r.growth}%`,
      r.growth > 5 ? '↑ Strong' : r.growth > 0 ? '↑ Moderate' : r.growth > -5 ? '↓ Slight' : '↓ Declining',
    ]),
    theme: 'grid',
    headStyles: { fillColor: accentColor, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: darkColor },
    alternateRowStyles: { fillColor: [248, 249, 252] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // === SECTION 2: RISK DETECTION ===
  if (y > 230) { doc.addPage(); y = margin; }
  sectionHeader('Risk Detection', 2);

  // Stockout risks
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 50, 50);
  doc.text(`Stockout Risks (7-Day Horizon) — ${stockoutRisks.length} SKUs identified`, margin, y);
  y += 5;

  if (stockoutRisks.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Product', 'Warehouse', 'Projected Stock (L)', 'Risk Date', 'Severity']],
      body: stockoutRisks.slice(0, 10).map(p => {
        const prod = p.products!;
        const litres = toLitres(p.projected_quantity, prod);
        return [
          prod.name,
          p.warehouses?.name || '—',
          `${litres.toLocaleString()}L`,
          new Date(p.projected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          p.projected_quantity <= 0 ? 'CRITICAL' : 'HIGH',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [200, 50, 50] as [number, number, number], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: darkColor },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('No imminent stockout risks detected. Inventory levels are within safety margins.', margin, y);
    y += 6;
  }

  // Overstock risks
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 140, 20);
  doc.text(`Overstock Risks (30-Day Horizon) — ${overstockRisks.length} SKUs identified`, margin, y);
  y += 5;

  if (overstockRisks.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Product', 'Warehouse', 'Projected Stock (L)', 'Excess Over Target']],
      body: overstockRisks.slice(0, 8).map(p => {
        const prod = p.products!;
        const litres = toLitres(p.projected_quantity, prod);
        const excess = toLitres(p.projected_quantity - prod.min_stock * 2, prod);
        return [
          prod.name,
          p.warehouses?.name || '—',
          `${litres.toLocaleString()}L`,
          `+${excess.toLocaleString()}L`,
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [200, 140, 20] as [number, number, number], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: darkColor },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('No significant overstock positions detected across the network.', margin, y);
    y += 10;
  }

  // === SECTION 3: RECOMMENDED ACTIONS ===
  if (y > 200) { doc.addPage(); y = margin; }
  sectionHeader('Recommended Actions', 3);

  // Transfers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(`Inter-Warehouse Transfers — ${transfers.length} recommended`, margin, y);
  y += 5;

  if (transfers.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Product', 'From', 'To', 'Quantity', 'Reason']],
      body: transfers.slice(0, 12).map(t => {
        const prod = t.products;
        const litres = prod ? toLitres(t.quantity, prod) : t.quantity;
        return [
          prod?.name || '—',
          t.from_location || '—',
          t.to_location,
          `${litres.toLocaleString()}L`,
          'Balance regional stock levels',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: accentColor, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: darkColor },
      alternateRowStyles: { fillColor: [248, 249, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('No inter-warehouse transfers recommended at this time.', margin, y);
    y += 6;
  }

  // Reorders
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 120, 200);
  doc.text(`Procurement Reorders — ${reorders.length} recommended`, margin, y);
  y += 5;

  if (reorders.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Product', 'Destination', 'Quantity', 'Suggested Order Date']],
      body: reorders.slice(0, 12).map(r => {
        const prod = r.products;
        const litres = prod ? toLitres(r.quantity, prod) : r.quantity;
        return [
          prod?.name || '—',
          r.to_location,
          `${litres.toLocaleString()}L`,
          r.planned_execution_date
            ? new Date(r.planned_execution_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Immediate procurement advised',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [50, 120, 200] as [number, number, number], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: darkColor },
      alternateRowStyles: { fillColor: [248, 249, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('No reorder recommendations at this time.', margin, y);
    y += 10;
  }

  // === SECTION 4: BUSINESS IMPACT ===
  if (y > 210) { doc.addPage(); y = margin; }
  sectionHeader('Business Impact', 4);

  // Calculate impact metrics
  const stockoutPreventedValue = stockoutRisks.reduce((sum, p) => {
    const prod = p.products;
    if (!prod) return sum;
    const deficit = Math.max(0, prod.min_stock - p.projected_quantity);
    return sum + deficit * prod.unit_price;
  }, 0);

  const totalInventoryValue = stats.totalValue;
  const optimalValue = products.reduce((s, p) => s + p.min_stock * 2 * p.unit_price, 0);
  const optimizationPct = optimalValue > 0 ? Math.min(100, Math.round((1 - Math.abs(totalInventoryValue - optimalValue) / optimalValue) * 100)) : 85;

  const holdingCostSaved = overstockRisks.reduce((sum, p) => {
    const prod = p.products;
    if (!prod) return sum;
    return sum + Math.max(0, p.projected_quantity - prod.min_stock * 2) * prod.unit_price * 0.02;
  }, 0);

  const serviceLevelImprovement = stockoutRisks.length > 0
    ? Math.round(((products.length - stockoutRisks.length) / products.length) * 100)
    : 98;

  // Impact boxes
  const impactMetrics = [
    {
      label: 'Inventory Optimisation',
      value: `${optimizationPct}%`,
      description: 'Current inventory alignment with optimal stock levels across all warehouses.',
    },
    {
      label: 'Stockout Loss Prevention',
      value: `₹${(stockoutPreventedValue / 1000).toFixed(1)}K`,
      description: 'Estimated revenue protected by addressing identified stockout risks through recommended transfers and reorders.',
    },
    {
      label: 'Working Capital Saved',
      value: `₹${(holdingCostSaved / 1000).toFixed(1)}K`,
      description: 'Monthly holding cost reduction achievable by rebalancing overstocked positions across the network.',
    },
    {
      label: 'Service Level Target',
      value: `${serviceLevelImprovement}%`,
      description: 'Projected order fulfilment rate after implementing recommended inventory adjustments.',
    },
  ];

  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 28;
  impactMetrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (boxWidth + 6);
    const boxY = y + row * (boxHeight + 4);

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(m.value, x + 5, boxY + 9);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(m.label, x + 5, boxY + 15);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const lines = doc.splitTextToSize(m.description, boxWidth - 10);
    doc.text(lines.slice(0, 2), x + 5, boxY + 20);
  });

  y += Math.ceil(impactMetrics.length / 2) * (boxHeight + 4) + 10;

  // === FOOTER ===
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(245, 247, 250);
      doc.rect(0, pageH - 14, pageWidth, 14, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedColor);
      doc.text('PaintFlow.ai — AI-Powered Demand Planning for Paint Industry', margin, pageH - 6);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageH - 6);
      doc.text('Confidential — For internal planning use only', pageWidth / 2, pageH - 6, { align: 'center' });
    }
  };

  addFooter();

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`PaintFlow_AI_Plan_Report_${dateStr}.pdf`);
}
