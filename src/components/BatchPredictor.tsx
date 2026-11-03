import React, { useState } from 'react';
import { BuildingFeatures, predictBuildingEnergy } from '../utils/mlModels';
import { Database, Download, Upload, RefreshCw, FileSpreadsheet, Check, FileText, Loader2 } from 'lucide-react';
import { generateBatchEnergyPdf } from '../utils/pdfReportGenerator';

interface BatchBuildingRow extends BuildingFeatures {
  id: string;
  name: string;
  coolingLoad?: number;
  heatingLoad?: number;
  hvacTR?: number;
  rating?: string;
}

const SAMPLE_BENCHMARK_DATA: BatchBuildingRow[] = [
  { id: 'BLD-01', name: 'Standard Residential North', relativeCompactness: 0.98, surfaceArea: 514.5, wallArea: 294.0, roofArea: 110.25, overallHeight: 7.0, orientation: 2, glazingArea: 0.0, glazingDistribution: 0 },
  { id: 'BLD-02', name: 'Standard Residential East', relativeCompactness: 0.98, surfaceArea: 514.5, wallArea: 294.0, roofArea: 110.25, overallHeight: 7.0, orientation: 3, glazingArea: 0.10, glazingDistribution: 1 },
  { id: 'BLD-03', name: 'Glazed Pavilion South', relativeCompactness: 0.90, surfaceArea: 563.5, wallArea: 318.5, roofArea: 122.5, overallHeight: 7.0, orientation: 4, glazingArea: 0.25, glazingDistribution: 4 },
  { id: 'BLD-04', name: 'Commercial Block West', relativeCompactness: 0.86, surfaceArea: 588.0, wallArea: 318.5, roofArea: 134.75, overallHeight: 7.0, orientation: 5, glazingArea: 0.40, glazingDistribution: 5 },
  { id: 'BLD-05', name: 'Single-Story Office North', relativeCompactness: 0.82, surfaceArea: 612.5, wallArea: 318.5, roofArea: 147.0, overallHeight: 3.5, orientation: 2, glazingArea: 0.10, glazingDistribution: 2 },
  { id: 'BLD-06', name: 'Single-Story Clinic South', relativeCompactness: 0.79, surfaceArea: 637.0, wallArea: 343.0, roofArea: 147.0, overallHeight: 3.5, orientation: 4, glazingArea: 0.25, glazingDistribution: 4 },
  { id: 'BLD-07', name: 'Sprawling Campus Hall', relativeCompactness: 0.74, surfaceArea: 686.0, wallArea: 245.0, roofArea: 220.5, overallHeight: 3.5, orientation: 3, glazingArea: 0.10, glazingDistribution: 1 },
  { id: 'BLD-08', name: 'High-Glazed Sprawl South', relativeCompactness: 0.71, surfaceArea: 710.5, wallArea: 269.5, roofArea: 220.5, overallHeight: 3.5, orientation: 4, glazingArea: 0.40, glazingDistribution: 4 },
  { id: 'BLD-09', name: 'Two-Story Villa West', relativeCompactness: 0.69, surfaceArea: 735.0, wallArea: 294.0, roofArea: 220.5, overallHeight: 7.0, orientation: 5, glazingArea: 0.25, glazingDistribution: 5 },
  { id: 'BLD-10', name: 'Distribution Center (No Glaze)', relativeCompactness: 0.66, surfaceArea: 759.5, wallArea: 318.5, roofArea: 220.5, overallHeight: 3.5, orientation: 2, glazingArea: 0.0, glazingDistribution: 0 },
  { id: 'BLD-11', name: 'Heavy-Glazed Tech Lab', relativeCompactness: 0.64, surfaceArea: 784.0, wallArea: 343.0, roofArea: 220.5, overallHeight: 7.0, orientation: 4, glazingArea: 0.40, glazingDistribution: 4 },
  { id: 'BLD-12', name: 'Suburban School Block', relativeCompactness: 0.62, surfaceArea: 808.5, wallArea: 367.5, roofArea: 220.5, overallHeight: 3.5, orientation: 3, glazingArea: 0.10, glazingDistribution: 3 },
];

export const BatchPredictor: React.FC = () => {
  const [data, setData] = useState<BatchBuildingRow[]>(() => {
    // Run initial inference on all sample rows
    return SAMPLE_BENCHMARK_DATA.map((row) => {
      const pred = predictBuildingEnergy(row);
      return {
        ...row,
        coolingLoad: pred.coolingLoad,
        heatingLoad: pred.heatingLoad,
        hvacTR: pred.hvacTonnageTR,
        rating: pred.energyEfficiencyRating,
      };
    });
  });

  const [copiedNotification, setCopiedNotification] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const exportPDF = async () => {
    setGeneratingPdf(true);
    try {
      await generateBatchEnergyPdf(data, 'Temperate');
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Building ID',
      'Name',
      'Compactness (X1)',
      'Surface Area (X2)',
      'Wall Area (X3)',
      'Roof Area (X4)',
      'Height (X5)',
      'Orientation (X6)',
      'Glazing Ratio (X7)',
      'Glazing Dist (X8)',
      'Predicted Cooling Load (Y2 kWh/m2)',
      'Predicted Heating Load (Y1 kWh/m2)',
      'HVAC Tonnage (TR)',
      'Energy Rating',
    ];

    const rows = data.map((d) => [
      d.id,
      `"${d.name}"`,
      d.relativeCompactness,
      d.surfaceArea,
      d.wallArea,
      d.roofArea,
      d.overallHeight,
      d.orientation,
      d.glazingArea,
      d.glazingDistribution,
      d.coolingLoad,
      d.heatingLoad,
      d.hvacTR,
      d.rating,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cooling_load_predictions_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-lg">Batch Building Energy Predictor</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate multiple architectural geometries simultaneously using the 4-model ensemble.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Executive PDF Report Button */}
          <button
            onClick={exportPDF}
            disabled={generatingPdf}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            title="Download Executive Energy Report PDF with visual charts and full analysis"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rendering PDF...
              </>
            ) : pdfSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                PDF Downloaded!
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Export Executive PDF Report (With Graphs)
              </>
            )}
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Total Buildings</span>
          <span className="text-xl font-bold text-white font-mono">{data.length}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Average Cooling Load</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">
            {(data.reduce((acc, d) => acc + (d.coolingLoad || 0), 0) / data.length).toFixed(1)} kWh/m²
          </span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Lowest Cooling (Best)</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {Math.min(...data.map((d) => d.coolingLoad || 99)).toFixed(1)} kWh/m²
          </span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Peak HVAC Tonnage Range</span>
          <span className="text-xl font-bold text-amber-400 font-mono">
            {Math.min(...data.map((d) => d.hvacTR || 0)).toFixed(1)} - {Math.max(...data.map((d) => d.hvacTR || 0)).toFixed(1)} TR
          </span>
        </div>
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-medium">
              <th className="py-2.5 px-3">Building ID</th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3 text-center">X₁ (Compactness)</th>
              <th className="py-2.5 px-3 text-center">X₅ (Height)</th>
              <th className="py-2.5 px-3 text-center">X₇ (Glazing)</th>
              <th className="py-2.5 px-3 text-center">X₆ (Orient)</th>
              <th className="py-2.5 px-3 text-right">Cooling (Y₂)</th>
              <th className="py-2.5 px-3 text-right">Heating (Y₁)</th>
              <th className="py-2.5 px-3 text-right">HVAC (TR)</th>
              <th className="py-2.5 px-3 text-center">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {data.map((b) => (
              <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-cyan-400">{b.id}</td>
                <td className="py-2.5 px-3 font-sans text-slate-200">{b.name}</td>
                <td className="py-2.5 px-3 text-center text-slate-300">{b.relativeCompactness.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center text-slate-300">{b.overallHeight}m</td>
                <td className="py-2.5 px-3 text-center text-amber-300">{Math.round(b.glazingArea * 100)}%</td>
                <td className="py-2.5 px-3 text-center text-slate-300">
                  {b.orientation === 2 ? 'N' : b.orientation === 3 ? 'E' : b.orientation === 4 ? 'S' : 'W'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-white">
                  {b.coolingLoad?.toFixed(1)} <span className="text-[10px] text-slate-500 font-sans">kWh/m²</span>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {b.heatingLoad?.toFixed(1)} <span className="text-[10px] text-slate-500 font-sans">kWh/m²</span>
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-cyan-300">
                  {b.hvacTR?.toFixed(1)} TR
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      b.rating?.startsWith('A')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : b.rating === 'B' || b.rating === 'C'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {b.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
