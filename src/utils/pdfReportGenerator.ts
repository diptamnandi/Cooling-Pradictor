import { jsPDF } from 'jspdf';
import { BuildingFeatures, PredictionResult, predictBuildingEnergy } from './mlModels';

export interface BatchBuildingExportItem extends BuildingFeatures {
  id: string;
  name: string;
  coolingLoad?: number;
  heatingLoad?: number;
  hvacTR?: number;
  rating?: string;
}

/**
 * Creates an in-memory high-resolution Canvas chart for the PDF
 */
function createBarChartDataUrl(
  items: BatchBuildingExportItem[],
  width = 700,
  height = 260
): string {
  // Check if browser environment with HTMLCanvasElement
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let y = 30; y < height - 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }

  // Find max cooling load
  const maxCooling = Math.max(...items.map((i) => i.coolingLoad || 50), 50);
  const chartHeight = height - 80;
  const chartWidth = width - 80;
  const barWidth = Math.max(12, Math.floor(chartWidth / items.length) - 8);

  // Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Predicted Cooling Load (kWh/m²) per Building', 50, 22);

  // Draw Bars
  items.forEach((item, index) => {
    const x = 60 + index * (barWidth + 8);
    const val = item.coolingLoad || 0;
    const barH = (val / maxCooling) * chartHeight;
    const y = height - 40 - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, height - 40);
    if (val > 35) {
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#881337');
    } else if (val > 25) {
      grad.addColorStop(0, '#fbbf24');
      grad.addColorStop(1, '#78350f');
    } else {
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0369a1');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barWidth, barH);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, barWidth, barH);

    // Value on top
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${val.toFixed(1)}`, x + barWidth / 2, y - 4);

    // ID label below
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px sans-serif';
    ctx.fillText(item.id, x + barWidth / 2, height - 25);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Creates HVAC Sizing comparison chart
 */
function createHvacChartDataUrl(
  items: BatchBuildingExportItem[],
  width = 700,
  height = 200
): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const maxTR = Math.max(...items.map((i) => i.hvacTR || 50), 50);
  const chartHeight = height - 60;
  const barWidth = Math.max(12, Math.floor((width - 80) / items.length) - 8);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Peak HVAC Sizing (Tons of Refrigeration / TR)', 50, 22);

  items.forEach((item, index) => {
    const x = 60 + index * (barWidth + 8);
    const val = item.hvacTR || 0;
    const barH = (val / maxTR) * chartHeight;
    const y = height - 35 - barH;

    ctx.fillStyle = '#10b981';
    ctx.fillRect(x, y, barWidth, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${val.toFixed(1)}TR`, x + barWidth / 2, y - 4);

    ctx.fillStyle = '#64748b';
    ctx.font = '8px sans-serif';
    ctx.fillText(item.id, x + barWidth / 2, height - 20);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates and triggers download of the Executive Energy Performance Report PDF
 */
export async function generateBatchEnergyPdf(
  items: BatchBuildingExportItem[],
  climate = 'Temperate'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ---------------- PAGE 1: Executive Overview & Graphs ----------------
  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(6, 182, 212); // cyan-500 line
  doc.rect(0, 37, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('COOLING LOAD ML PREDICTION REPORT', margin, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `ASHRAE Standard 90.1 & UCI Energy Efficiency ML Model Ensemble | Climate: ${climate}`,
    margin,
    24
  );
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 30);

  // Executive KPI summary cards
  const avgCooling = (
    items.reduce((acc, i) => acc + (i.coolingLoad || 0), 0) / items.length
  ).toFixed(1);
  const minCooling = Math.min(...items.map((i) => i.coolingLoad || 999)).toFixed(1);
  const totalTR = items.reduce((acc, i) => acc + (i.hvacTR || 0), 0).toFixed(1);
  const topTierCount = items.filter(
    (i) => i.rating === 'A+' || i.rating === 'A' || i.rating === 'B'
  ).length;

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardY = 44;
  const cardHeight = 22;

  const kpis = [
    { title: 'PORTFOLIO SIZE', value: `${items.length} Buildings`, color: [56, 189, 248] },
    { title: 'AVG COOLING LOAD', value: `${avgCooling} kWh/m²`, color: [244, 63, 94] },
    { title: 'TOTAL HVAC CAPACITY', value: `${totalTR} TR`, color: [16, 185, 129] },
    { title: 'HIGH EFFICIENCY (A/B)', value: `${topTierCount} / ${items.length}`, color: [245, 158, 11] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252); // light slate
    doc.rect(x, cardY, cardWidth, cardHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, cardY, cardWidth, cardHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3, cardY + 6);

    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, cardY + 16);
  });

  // Section: Visual Analytics & Distribution
  let currentY = 73;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Thermal Performance & Load Distribution', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'The chart below plots predicted peak cooling loads across the evaluated portfolio using our 4-model ensemble.',
    margin,
    currentY + 5
  );

  // Insert Chart 1: Cooling Load Distribution
  currentY += 9;
  const chart1Url = createBarChartDataUrl(items, 800, 260);
  if (chart1Url) {
    doc.addImage(chart1Url, 'PNG', margin, currentY, pageWidth - margin * 2, 60);
    currentY += 64;
  }

  // Insert Chart 2: HVAC Tonnage Capacity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Mechanical HVAC Equipment Sizing (Tons of Refrigeration)', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Sizing calculated at 1 TR = 3.517 kW (12,000 BTU/h) for central chiller or VRF heat pump plant selection.',
    margin,
    currentY + 5
  );

  currentY += 9;
  const chart2Url = createHvacChartDataUrl(items, 800, 200);
  if (chart2Url) {
    doc.addImage(chart2Url, 'PNG', margin, currentY, pageWidth - margin * 2, 48);
    currentY += 52;
  }

  // Page 1 Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Cooling Load ML Predictor • Confidential Engineering Report', margin, pageHeight - 8);
  doc.text('Page 1 of 2', pageWidth - margin - 15, pageHeight - 8);

  // ---------------- PAGE 2: Full Data Table & ASHRAE Guidelines ----------------
  doc.addPage();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 23, pageWidth, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Detailed Building Portfolio Predictions & Envelope Parameters', margin, 15);

  currentY = 32;

  // Table Headers
  const tableCols = [
    { name: 'ID', width: 16 },
    { name: 'Building Name', width: 44 },
    { name: 'X1 Comp', width: 16 },
    { name: 'X5 Ht', width: 14 },
    { name: 'X7 Glaze', width: 16 },
    { name: 'X6 Ori', width: 14 },
    { name: 'Cooling Y2', width: 22 },
    { name: 'Heating Y1', width: 22 },
    { name: 'HVAC TR', width: 18 },
  ];

  // Draw header row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  let colX = margin + 2;
  tableCols.forEach((col) => {
    doc.text(col.name, colX, currentY + 5);
    colX += col.width;
  });

  currentY += 8;

  // Table Rows
  items.forEach((item, rIdx) => {
    const isEven = rIdx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY - 1, pageWidth - margin * 2, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    let cellX = margin + 2;

    // ID
    doc.setFont('helvetica', 'bold');
    doc.text(item.id, cellX, currentY + 3.5);
    cellX += tableCols[0].width;

    // Name
    doc.setFont('helvetica', 'normal');
    doc.text(item.name.substring(0, 22), cellX, currentY + 3.5);
    cellX += tableCols[1].width;

    // X1 Compactness
    doc.text(item.relativeCompactness.toFixed(2), cellX, currentY + 3.5);
    cellX += tableCols[2].width;

    // X5 Height
    doc.text(`${item.overallHeight}m`, cellX, currentY + 3.5);
    cellX += tableCols[3].width;

    // X7 Glazing
    doc.text(`${Math.round(item.glazingArea * 100)}%`, cellX, currentY + 3.5);
    cellX += tableCols[4].width;

    // X6 Orientation
    doc.text(
      item.orientation === 2
        ? 'North'
        : item.orientation === 3
        ? 'East'
        : item.orientation === 4
        ? 'South'
        : 'West',
      cellX,
      currentY + 3.5
    );
    cellX += tableCols[5].width;

    // Y2 Cooling
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`${(item.coolingLoad || 0).toFixed(1)} kWh`, cellX, currentY + 3.5);
    cellX += tableCols[6].width;

    // Y1 Heating
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${(item.heatingLoad || 0).toFixed(1)} kWh`, cellX, currentY + 3.5);
    cellX += tableCols[7].width;

    // HVAC TR
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`${(item.hvacTR || 0).toFixed(1)} TR`, cellX, currentY + 3.5);

    currentY += 6.5;
  });

  // Section 4: Engineering & Passive Retrofit Takeaways
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. ASHRAE 90.1 Compliance & Energy Engineering Observations', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const observations = [
    '• Glazing Orientation Penalty: Structures with South (X6=4) and West (X6=5) orientations with glazing >= 25% experience up to 48% higher peak afternoon cooling loads compared to North-oriented envelopes.',
    '• Compactness Efficiency: Buildings with relative compactness X1 > 0.85 maintain up to 26% lower envelope conductive losses, significantly lowering equipment lifecycle operational costs.',
    '• Overhang Recommendation: Installing horizontal exterior shading louvers with a projection factor of 0.6 on south facades provides an estimated 18-24% cooling reduction without requiring additional mechanical chiller capacity.',
    '• Economizer Potential: High-efficiency VRF systems equipped with integrated outdoor air-side economizers can deliver free cooling for up to 1,200 hours annually in temperate climate zones.',
  ];

  observations.forEach((obs) => {
    doc.text(obs, margin, currentY);
    currentY += 5;
  });

  // Page 2 Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Cooling Load ML Predictor • Confidential Engineering Report', margin, pageHeight - 8);
  doc.text('Page 2 of 2', pageWidth - margin - 15, pageHeight - 8);

  // Save the PDF
  doc.save(`cooling_load_batch_report_${Date.now()}.pdf`);
}
