import React from 'react';
import { BuildingFeatures, BUILDING_PRESETS } from '../utils/mlModels';
import { RotateCcw, Sliders, Sparkles, HelpCircle, Zap } from 'lucide-react';

interface BuildingParameterControlsProps {
  features: BuildingFeatures;
  onChange: (features: BuildingFeatures) => void;
  onSelectPreset: (presetKey: string) => void;
  onRunPrediction?: () => void;
  isPredicting?: boolean;
}

export const BuildingParameterControls: React.FC<BuildingParameterControlsProps> = ({
  features,
  onChange,
  onSelectPreset,
  onRunPrediction,
  isPredicting = false,
}) => {
  const updateFeature = <K extends keyof BuildingFeatures>(key: K, value: BuildingFeatures[K]) => {
    onChange({
      ...features,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header & Presets */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold text-base">Envelope Parameters</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            UCI Benchmark Features (X₁ - X₈)
          </span>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(BUILDING_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onSelectPreset(key)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 border border-slate-700 transition-all font-medium flex items-center gap-1"
              title={preset.description}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
            </button>
          ))}
        </div>

        {/* Primary Prediction Button */}
        <button
          onClick={onRunPrediction}
          disabled={isPredicting}
          className="w-full mt-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:via-teal-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
        >
          <Zap className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
          {isPredicting ? 'Calculating Ensemble Predictions...' : '⚡ Run ML Load Prediction & Update 3D Twin'}
        </button>
      </div>

      {/* Climate Zone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span>Climate Zone & Outdoor Design Temp</span>
          <span className="text-[11px] text-slate-400 font-normal">Cooling Degree Days (CDD)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'temperate', label: 'Temperate', desc: 'Moderate Cooling' },
            { id: 'hot_humid', label: 'Hot & Humid', desc: 'Tropical / High CDD' },
            { id: 'hot_arid', label: 'Hot & Arid', desc: 'Desert / Extreme Solar' },
            { id: 'cold', label: 'Cold / Subarctic', desc: 'Heating-Dominated' },
          ].map((zone) => (
            <button
              key={zone.id}
              onClick={() => updateFeature('climateZone', zone.id as any)}
              className={`p-2 rounded-xl text-left border transition-all ${
                features.climateZone === zone.id
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-semibold">{zone.label}</div>
              <div className="text-[10px] opacity-75">{zone.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* X1: Relative Compactness */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              X₁: Relative Compactness
            </span>
            <span className="font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              {features.relativeCompactness.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.62"
            max="0.98"
            step="0.02"
            value={features.relativeCompactness}
            onChange={(e) => updateFeature('relativeCompactness', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.62 (Sprawling)</span>
            <span>0.76 (Mean)</span>
            <span>0.98 (Cubic)</span>
          </div>
        </div>

        {/* X5: Overall Height */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₅: Building Height / Stories
            </span>
            <span className="font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              {features.overallHeight}m ({features.overallHeight >= 5.0 ? '2-Story' : '1-Story'})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => updateFeature('overallHeight', 3.5)}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                features.overallHeight === 3.5
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              3.5m (Single Story)
            </button>
            <button
              onClick={() => updateFeature('overallHeight', 7.0)}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                features.overallHeight === 7.0
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              7.0m (Two Stories)
            </button>
          </div>
        </div>

        {/* X7: Glazing Area Ratio */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₇: Glazing Area Ratio (WWR)
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              {Math.round(features.glazingArea * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0.0, label: '0%' },
              { val: 0.10, label: '10%' },
              { val: 0.25, label: '25%' },
              { val: 0.40, label: '40%' },
            ].map((g) => (
              <button
                key={g.val}
                onClick={() => updateFeature('glazingArea', g.val)}
                className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                  Math.abs(features.glazingArea - g.val) < 0.01
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500">
            Window-to-Wall ratio directly determines solar thermal gain.
          </span>
        </div>

        {/* X6: Orientation */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₆: Building Orientation
            </span>
            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {features.orientation === 2 ? 'North (2)' : features.orientation === 3 ? 'East (3)' : features.orientation === 4 ? 'South (4)' : 'West (5)'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { code: 2, name: 'North' },
              { code: 3, name: 'East' },
              { code: 4, name: 'South' },
              { code: 5, name: 'West' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => updateFeature('orientation', item.code)}
                className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                  features.orientation === item.code
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500">
            South and West orientations absorb greatest afternoon heat load.
          </span>
        </div>

        {/* X4: Roof Area */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₄: Roof Area
            </span>
            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {features.roofArea.toFixed(1)} m²
            </span>
          </div>
          <input
            type="range"
            min="110.25"
            max="220.5"
            step="12.25"
            value={features.roofArea}
            onChange={(e) => updateFeature('roofArea', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>110.25 m²</span>
            <span>176.6 m²</span>
            <span>220.5 m²</span>
          </div>
        </div>

        {/* X3: Wall Area */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₃: Wall Area
            </span>
            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {features.wallArea.toFixed(1)} m²
            </span>
          </div>
          <input
            type="range"
            min="245.0"
            max="416.5"
            step="24.5"
            value={features.wallArea}
            onChange={(e) => updateFeature('wallArea', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>245.0 m²</span>
            <span>318.5 m²</span>
            <span>416.5 m²</span>
          </div>
        </div>

        {/* X2: Total Surface Area */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₂: Total Surface Area
            </span>
            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {features.surfaceArea.toFixed(1)} m²
            </span>
          </div>
          <input
            type="range"
            min="514.5"
            max="808.5"
            step="24.5"
            value={features.surfaceArea}
            onChange={(e) => updateFeature('surfaceArea', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>514.5 m²</span>
            <span>671.7 m²</span>
            <span>808.5 m²</span>
          </div>
        </div>

        {/* X8: Glazing Distribution */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-200">
              X₈: Glazing Distribution
            </span>
            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {['None (0)', 'Uniform (1)', 'North (2)', 'East (3)', 'South (4)', 'West (5)'][features.glazingDistribution] || 'Uniform'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: 1, label: 'Uniform' },
              { val: 2, label: 'North' },
              { val: 3, label: 'East' },
              { val: 4, label: 'South' },
              { val: 5, label: 'West' },
              { val: 0, label: 'None' },
            ].map((d) => (
              <button
                key={d.val}
                onClick={() => updateFeature('glazingDistribution', d.val)}
                className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                  features.glazingDistribution === d.val
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
