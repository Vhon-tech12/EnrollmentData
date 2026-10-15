'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============ CHART TYPES ============
export interface LineSeries {
  name: string;
  color: [number, number, number];
  key: 'value' | 'secondary';
}

export interface LineChart {
  type: 'line';
  title: string;
  data: { label: string; value: number; secondary?: number }[];
  series: LineSeries[];
}

export interface BarChart {
  type: 'bar-horizontal' | 'bar-vertical';
  title: string;
  data: { label: string; value: number; color?: [number, number, number] }[];
}

export interface DonutChart {
  type: 'donut';
  title: string;
  data: { label: string; value: number; color: [number, number, number] }[];
}

export interface GaugeChart {
  type: 'gauge';
  title: string;
  value: number;
  label: string;
}

export interface ProgressBarsChart {
  type: 'progress-bars';
  title: string;
  items: {
    label: string;
    value: number;
    percentage: number;
    color?: [number, number, number];
  }[];
}

export interface ComparisonTableChart {
  type: 'comparison-table';
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export type ChartConfig =
  | LineChart
  | BarChart
  | DonutChart
  | GaugeChart
  | ProgressBarsChart
  | ComparisonTableChart;

export interface ExportData {
  title: string;
  subtitle: string;
  summary: { label: string; value: string | number }[];
  columns: string[];
  rows: (string | number)[][];
  chart?: ChartConfig;
  charts?: ChartConfig[];
}

// ============ CORE PDF BUILDER ============
function buildPDF(data: ExportData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATE UNIVERSITY', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Enrollment Data Analytics and Reporting System', pageWidth / 2, 56, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.title, pageWidth / 2, 80, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(data.subtitle, pageWidth / 2, 94, { align: 'center' });

  const boxY = 112;
  const boxWidth = (pageWidth - 80) / data.summary.length;
  data.summary.forEach((item, i) => {
    const x = 40 + i * boxWidth;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x + 4, boxY, boxWidth - 8, 44, 4, 4, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label.toUpperCase(), x + boxWidth / 2, boxY + 16, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.value), x + boxWidth / 2, boxY + 34, { align: 'center' });
  });

  let currentY = boxY + 64;

  const chartsToRender: ChartConfig[] = data.charts
    ? data.charts
    : data.chart
      ? [data.chart]
      : [];

  if (chartsToRender.length > 0) {
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.line(40, currentY, 40 + 3, currentY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Visual Analytics', 50, currentY + 1.5);

    currentY += 16;

    for (let i = 0; i < chartsToRender.length; i++) {
      const chart = chartsToRender[i];

      let estimatedHeight = 200; // Default fallback

      switch (chart.type) {
        case 'line':
          estimatedHeight = 240;
          break;
        case 'bar-horizontal':
          estimatedHeight = 40 + chart.data.length * 26;
          break;
        case 'bar-vertical':
          estimatedHeight = 200;
          break;
        case 'donut':
          estimatedHeight = 220;
          break;
        case 'gauge':
          estimatedHeight = 180;
          break;
        case 'progress-bars':
          estimatedHeight = 40 + chart.items.length * 32;
          break;
        case 'comparison-table':
          estimatedHeight = 60 + chart.rows.length * 24;
          break;
      }

      if (currentY + estimatedHeight > pageHeight - 80) {
        doc.addPage();
        currentY = 40;
      }

      currentY = drawChart(doc, chart, currentY, pageWidth);
      currentY += 20;
    }
  }

  if (currentY + 100 > pageHeight - 80) {
    doc.addPage();
    currentY = 40;
  }

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.5);
  doc.line(40, currentY, 40 + 3, currentY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detailed Data', 50, currentY + 1.5);

  currentY += 12;

  autoTable(doc, {
    startY: currentY,
    head: [data.columns],
    body: data.rows.map((row) => row.map((cell) => String(cell))),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left' },
    },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${now}`, 40, pageHeight - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
  }

  return doc;
}

// ============ CHART DISPATCHER ============
function drawChart(
  doc: jsPDF,
  chart: ChartConfig,
  startY: number,
  pageWidth: number,
): number {
  switch (chart.type) {
    case 'line':
      return drawLineChart(doc, chart, startY, pageWidth);
    case 'bar-horizontal':
      return drawHorizontalBarChart(doc, chart, startY, pageWidth);
    case 'bar-vertical':
      return drawVerticalBarChart(doc, chart, startY, pageWidth);
    case 'donut':
      return drawDonutChart(doc, chart, startY, pageWidth);
    case 'gauge':
      return drawGaugeChart(doc, chart, startY, pageWidth);
    case 'progress-bars':
      return drawProgressBarsChart(doc, chart, startY, pageWidth);
    case 'comparison-table':
      return drawComparisonTableChart(doc, chart, startY, pageWidth);
    default:
      return startY;
  }
}

// ============ LINE CHART ============
function drawLineChart(
  doc: jsPDF,
  chart: LineChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartH = 240;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const boxTop = chartY + 18;
  const boxH = chartH - 18;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const P = { t: 24, r: 24, b: 42, l: 52 };
  const plotX = chartX + P.l;
  const plotY = boxTop + P.t;
  const plotW = chartW - P.l - P.r;
  const plotH = boxH - P.t - P.b;

  const data = chart.data;
  const maxVal = Math.max(...data.flatMap((d) => [d.value, d.secondary ?? 0]), 1);
  const yMax = Math.max(Math.ceil(maxVal / 5) * 5, 5);

  const xStep = data.length > 1 ? plotW / (data.length - 1) : 0;
  const x = (i: number) => plotX + i * xStep + (data.length === 1 ? plotW / 2 : 0);
  const y = (v: number) => plotY + plotH - (v / yMax) * plotH;

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (yMax / gridCount) * i;
    const yPos = y(val);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.6);
    doc.line(plotX, yPos, plotX + plotW, yPos);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(val)), plotX - 6, yPos + 2.5, { align: 'right' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(plotX, plotY, plotX, plotY + plotH);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  data.forEach((d, i) => {
    doc.text(d.label, x(i), plotY + plotH + 14, { align: 'center' });
  });

  chart.series.forEach((series) => {
    const points = data.map((d, i) => ({
      x: x(i),
      y: y(series.key === 'value' ? d.value : d.secondary ?? 0),
      val: series.key === 'value' ? d.value : d.secondary ?? 0,
    }));

    doc.setDrawColor(series.color[0], series.color[1], series.color[2]);
    doc.setLineWidth(2.2);
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    points.forEach((p) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(series.color[0], series.color[1], series.color[2]);
      doc.setLineWidth(1.6);
      doc.circle(p.x, p.y, 3.2, 'FD');
    });

    if (series.key === 'value' && points.length <= 10) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(series.color[0], series.color[1], series.color[2]);
      points.forEach((p) => {
        if (p.val > 0) {
          doc.text(String(p.val), p.x, p.y - 8, { align: 'center' });
        }
      });
    }
  });

  const legendY = boxTop + boxH - 14;
  const itemWidth = 100;
  const totalLegendW = chart.series.length * itemWidth;
  let legendX = chartX + (chartW - totalLegendW) / 2 + 8;

  chart.series.forEach((series) => {
    doc.setFillColor(series.color[0], series.color[1], series.color[2]);
    doc.circle(legendX, legendY - 1, 3.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(series.name, legendX + 8, legendY + 2);
    legendX += itemWidth;
  });

  return boxTop + boxH + 8;
}

// ============ HORIZONTAL BAR CHART ============
function drawHorizontalBarChart(
  doc: jsPDF,
  chart: BarChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const boxTop = chartY + 18;
  const rowH = 24;
  const boxH = 20 + chart.data.length * rowH;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const labelW = 70;
  const valueW = 40;
  const barAreaX = chartX + 16 + labelW;
  const barAreaW = chartW - labelW - valueW - 32;

  const maxVal = Math.max(...chart.data.map((d) => d.value), 1);

  chart.data.forEach((d, i) => {
    const rowY = boxTop + 16 + i * rowH;
    const color = d.color ?? [37, 99, 235];

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(d.label, chartX + 16, rowY + 4);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barAreaX, rowY - 4, barAreaW, 10, 3, 3, 'F');

    const barW = (d.value / maxVal) * barAreaW;
    doc.setFillColor(color[0], color[1], color[2]);
    if (barW > 0) {
      doc.roundedRect(barAreaX, rowY - 4, Math.max(barW, 4), 10, 3, 3, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(d.value), chartX + chartW - 16, rowY + 4, { align: 'right' });
  });

  return boxTop + boxH + 8;
}

// ============ VERTICAL BAR CHART ============
function drawVerticalBarChart(
  doc: jsPDF,
  chart: BarChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartH = 200;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const boxTop = chartY + 18;
  const boxH = chartH - 18;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const P = { t: 20, r: 20, b: 42, l: 40 };
  const plotX = chartX + P.l;
  const plotY = boxTop + P.t;
  const plotW = chartW - P.l - P.r;
  const plotH = boxH - P.t - P.b;

  const data = chart.data;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.max(Math.ceil(maxVal / 5) * 5, 5);

  const slotW = plotW / data.length;
  const barW = slotW * 0.5;

  const y = (v: number) => plotY + plotH - (v / yMax) * plotH;

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (yMax / gridCount) * i;
    const yPos = y(val);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.6);
    doc.line(plotX, yPos, plotX + plotW, yPos);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(val)), plotX - 6, yPos + 2.5, { align: 'right' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(plotX, plotY, plotX, plotY + plotH);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

  data.forEach((d, i) => {
    const centerX = plotX + i * slotW + slotW / 2;
    const barX = centerX - barW / 2;
    const barTopY = y(d.value);
    const barH = plotY + plotH - barTopY;
    const color = d.color ?? [37, 99, 235];

    doc.setFillColor(color[0], color[1], color[2]);
    if (barH > 0) {
      doc.roundedRect(barX, barTopY, barW, barH, 3, 3, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(d.value), centerX, barTopY - 4, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(d.label, centerX, plotY + plotH + 14, { align: 'center' });
  });

  return boxTop + boxH + 8;
}

// ============ DONUT CHART ============
function drawDonutChart(
  doc: jsPDF,
  chart: DonutChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartH = 220;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const boxTop = chartY + 18;
  const boxH = chartH - 18;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const total = chart.data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No data available.', chartX + chartW / 2, boxTop + boxH / 2, { align: 'center' });
    return boxTop + boxH + 8;
  }

  const centerX = chartX + chartW / 2 - 60;
  const centerY = boxTop + boxH / 2;
  const outerR = 62;
  const innerR = 38;

  let currentAngle = -90;

  chart.data.forEach((d) => {
    if (d.value === 0) return;
    const sliceAngle = (d.value / total) * 360;
    const endAngle = currentAngle + sliceAngle;

    doc.setFillColor(d.color[0], d.color[1], d.color[2]);

    const steps = Math.max(6, Math.ceil(sliceAngle / 4));
    const points: [number, number][] = [];
    points.push([centerX, centerY]);

    for (let i = 0; i <= steps; i++) {
      const a = ((currentAngle + (sliceAngle * i) / steps) * Math.PI) / 180;
      points.push([centerX + Math.cos(a) * outerR, centerY + Math.sin(a) * outerR]);
    }
    points.push([centerX, centerY]);

    doc.setDrawColor(d.color[0], d.color[1], d.color[2]);
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);

    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(centerX, centerY, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], 'F');
    }

    currentAngle = endAngle;
  });

  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(252, 252, 253);
  doc.circle(centerX, centerY, innerR, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(total), centerX, centerY + 2, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total', centerX, centerY + 14, { align: 'center' });

  const legendX = chartX + chartW - 220;
  const legendStartY = boxTop + boxH / 2 - (chart.data.length * 20) / 2 + 6;

  chart.data.forEach((d, i) => {
    const ly = legendStartY + i * 22;
    const pct = ((d.value / total) * 100).toFixed(1);

    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.circle(legendX, ly - 1, 4.5, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${d.label}`, legendX + 12, ly + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${d.value} (${pct}%)`, legendX + 90, ly + 3);
  });

  return boxTop + boxH + 8;
}

// ============ GAUGE CHART ============
function drawGaugeChart(
  doc: jsPDF,
  chart: GaugeChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartH = 180;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const boxTop = chartY + 18;
  const boxH = chartH - 18;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const centerX = chartX + chartW / 2;
  const centerY = boxTop + boxH - 30;
  const outerR = 55;

  const segments = 60;
  const startAngle = 180;
  const endAngle = 360;
  const range = endAngle - startAngle;

  // Background arc
  for (let i = 0; i < segments; i++) {
    const a1 = ((startAngle + (range * i) / segments) * Math.PI) / 180;
    const a2 = ((startAngle + (range * (i + 1)) / segments) * Math.PI) / 180;

    const x1o = centerX + Math.cos(a1) * outerR;
    const y1o = centerY + Math.sin(a1) * outerR;
    const x2o = centerX + Math.cos(a2) * outerR;
    const y2o = centerY + Math.sin(a2) * outerR;

    doc.setFillColor(241, 245, 249);
    doc.triangle(centerX, centerY, x1o, y1o, x2o, y2o, 'F');
  }

  // Progress arc — emerald gradient
  const progressSegments = Math.round((chart.value / 100) * segments);
  for (let i = 0; i < progressSegments; i++) {
    const a1 = ((startAngle + (range * i) / segments) * Math.PI) / 180;
    const a2 = ((startAngle + (range * (i + 1)) / segments) * Math.PI) / 180;

    const x1o = centerX + Math.cos(a1) * outerR;
    const y1o = centerY + Math.sin(a1) * outerR;
    const x2o = centerX + Math.cos(a2) * outerR;
    const y2o = centerY + Math.sin(a2) * outerR;

    const ratio = progressSegments > 1 ? i / (progressSegments - 1) : 0;
    const r = Math.round(4 + (110 - 4) * ratio);
    const g = Math.round(120 + (231 - 120) * ratio);
    const b = Math.round(87 + (183 - 87) * ratio);

    doc.setFillColor(r, g, b);
    doc.triangle(centerX, centerY, x1o, y1o, x2o, y2o, 'F');
  }

  // Inner white circle
  doc.setFillColor(252, 252, 253);
  doc.circle(centerX, centerY, outerR - 14, 'F');

  // Value text
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`${chart.value.toFixed(1)}%`, centerX, centerY - 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(chart.label, centerX, centerY + 10, { align: 'center' });

  return boxTop + boxH + 8;
}

// ============ PROGRESS BARS CHART ============
function drawProgressBarsChart(
  doc: jsPDF,
  chart: ProgressBarsChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const rowH = 32;
  const boxTop = chartY + 18;
  const boxH = 20 + chart.items.length * rowH;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  chart.items.forEach((item, i) => {
    const rowY = boxTop + 20 + i * rowH;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, chartX + 16, rowY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.value), chartX + chartW - 16, rowY, { align: 'right' });

    const barX = chartX + 16;
    const barY = rowY + 6;
    const barW = chartW - 32;
    const barH = 8;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barX, barY, barW, barH, 3, 3, 'F');

    const fillW = (item.percentage / 100) * barW;
    if (fillW > 0) {
      const color = item.color ?? [16, 185, 129];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(barX, barY, Math.max(fillW, 4), barH, 3, 3, 'F');
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${item.percentage.toFixed(1)}%`, chartX + chartW - 16, rowY + 22, { align: 'right' });
  });

  return boxTop + boxH + 8;
}

// ============ COMPARISON TABLE CHART ============
function drawComparisonTableChart(
  doc: jsPDF,
  chart: ComparisonTableChart,
  startY: number,
  pageWidth: number,
): number {
  const chartW = pageWidth - 80;
  const chartX = 40;
  const chartY = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(chart.title, chartX + chartW / 2, chartY + 10, { align: 'center' });

  const rowH = 24;
  const headerH = 28;
  const boxTop = chartY + 18;
  const boxH = headerH + chart.rows.length * rowH + 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(252, 252, 253);
  doc.setLineWidth(0.8);
  doc.roundedRect(chartX, boxTop, chartW, boxH, 6, 6, 'FD');

  const colCount = chart.headers.length;
  const colW = chartW / colCount;

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(chartX + 4, boxTop + 4, chartW - 8, headerH - 4, 4, 4, 'F');

  chart.headers.forEach((header, i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const xPos = chartX + i * colW + (i === 0 ? 16 : colW - 16);
    doc.text(header, xPos, boxTop + 20, { align: i === 0 ? 'left' : 'right' });
  });

  chart.rows.forEach((row, rowIndex) => {
    const rowY = boxTop + headerH + rowIndex * rowH + 15;

    row.forEach((cell, i) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setTextColor(51, 65, 85);

      const xPos = chartX + i * colW + (i === 0 ? 16 : colW - 16);
      doc.text(String(cell), xPos, rowY, { align: i === 0 ? 'left' : 'right' });
    });

    if (rowIndex < chart.rows.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(
        chartX + 8,
        boxTop + headerH + (rowIndex + 1) * rowH,
        chartX + chartW - 8,
        boxTop + headerH + (rowIndex + 1) * rowH,
      );
    }
  });

  return boxTop + boxH + 8;
}

// ============ PUBLIC API ============
export function exportToPDF(data: ExportData, filename: string) {
  const doc = buildPDF(data);
  doc.save(filename);
}

export function generatePDFPreviewUrl(data: ExportData): string {
  const doc = buildPDF(data);
  return doc.output('bloburl').toString();
}

export function exportToExcel(data: ExportData, filename: string) {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ['STATE UNIVERSITY'],
    ['Enrollment Data Analytics and Reporting System'],
    [],
    [data.title],
    [data.subtitle],
    [],
  ];

  data.summary.forEach((item) => {
    summaryRows.push([item.label, item.value]);
  });

  summaryRows.push([]);
  summaryRows.push(data.columns);

  const allRows = [...summaryRows, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  const colWidths: { wch: number }[] = [];
  for (let c = 0; c < data.columns.length; c++) {
    colWidths.push({ wch: c === 0 ? 28 : 18 });
  }
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}

export function printReport(data: ExportData) {
  const printWindow = window.open('', '_blank', 'width=900,height=650');
  if (!printWindow) {
    alert('Please allow pop-ups for this site to print the report.');
    return;
  }

  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.title)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; background: #fff; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
        .header h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 1.5px; color: #1e293b; }
        .header .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
        .header h2 { font-size: 14px; margin-top: 18px; color: #1e293b; }
        .header .filters { font-size: 10px; color: #64748b; margin-top: 6px; }
        .summary { display: grid; grid-template-columns: repeat(${data.summary.length}, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; background: #f8fafc; }
        .summary-label { font-size: 9px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .summary-value { font-size: 18px; font-weight: 700; margin-top: 4px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead { background: #2563eb; color: white; }
        th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        th:not(:first-child) { text-align: right; }
        td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
        td:not(:first-child) { text-align: right; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:last-child { font-weight: 700; background: #f1f5f9; border-top: 2px solid #cbd5e1; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
        @media print { body { padding: 20px; } @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>State University</h1>
        <div class="sub">Enrollment Data Analytics and Reporting System</div>
        <h2>${escapeHtml(data.title)}</h2>
        <div class="filters">${escapeHtml(data.subtitle)}</div>
      </div>
      <div class="summary">
        ${data.summary
          .map(
            (item) => `
          <div class="summary-item">
            <div class="summary-label">${escapeHtml(item.label)}</div>
            <div class="summary-value">${escapeHtml(String(item.value))}</div>
          </div>
        `,
          )
          .join('')}
      </div>
      <table>
        <thead>
          <tr>${data.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">Generated on ${escapeHtml(now)} · Enrollment Analytics System</div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 250); };
        window.onafterprint = function() { setTimeout(function() { window.close(); }, 100); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}