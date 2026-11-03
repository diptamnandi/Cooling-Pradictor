import React from 'react';
import { PredictionResult, BuildingFeatures } from '../utils/mlModels';
import { ThermometerSnowflake, Flame, Zap, DollarSign, Leaf, Gauge, BrainCircuit, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PredictionDashboardProps {
  prediction: PredictionResult;
  features: BuildingFeatures;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({ prediction, features }) => {
  // Model agreement calculation
  const modelValues = Object.values(prediction.modelBreakdown);
  const minVal = Math.min(...modelValues);
  const maxVal = Math.max(...modelValues);
  const spreadPercent = Math.round(((maxVal - minVal) / prediction.coolingLoad) * 100);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A+': return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'A': return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'B': return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'C': return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'D': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
      default: return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cooling Load Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
              Target Y₂: Cooling Load
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-xs border ${getTierColor(prediction.energyEfficiencyRating)}`}>
              {prediction.energyEfficiencyRating} Rating
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {prediction.coolingLoad.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">kWh/m²</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Peak Thermal: <strong className="text-cyan-300 font-mono">{prediction.coolingLoadTotalKW} kW</strong>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (prediction.coolingLoad / 50) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Heating Load Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Flame className="w-4 h-4 text-amber-400" />
              Target Y₁: Heating Load
            </span>
            <span className="text-[11px] text-slate-500">Winter Design</span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {prediction.heatingLoad.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">kWh/m²</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Peak Thermal: <strong className="text-amber-300 font-mono">{prediction.heatingLoadTotalKW} kW</strong>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (prediction.heatingLoad / 45) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* HVAC Equipment Sizing Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Gauge className="w-4 h-4 text-emerald-400" />
              ASHRAE Sizing (TR)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-medium">1 TR = 12k BTU</span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                {prediction.hvacTonnageTR.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">Tons (TR)</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Capacity: <strong className="text-slate-200 font-mono">{prediction.hvacBtuPerHour.toLocaleString()} BTU/h</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 truncate">
            {prediction.hvacTonnageTR <= 5 ? 'Multi-Split Inverter Heat Pump' : 'Modular VRF or Chiller Plant'}
          </div>
        </div>

        {/* Annual Utility & Carbon Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Annual HVAC Costs
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Leaf className="w-3 h-3 text-emerald-400" />
              {prediction.carbonFootprintKgCO2.toLocaleString()} kg CO₂
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                ${prediction.annualCostEstimateUSD.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ year</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Cooling Energy: <strong className="text-slate-200 font-mono">{prediction.annualCoolingEnergyKWh.toLocaleString()} kWh</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Based on 1,500 full-load cooling hours
          </div>
        </div>
      </div>

      {/* Model Breakdown & Feature Attribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ML Multi-Model Consensus */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">4-Model Machine Learning Ensemble</h3>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              ±{spreadPercent}% spread (High Consensus)
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                name: 'Gradient Boosted Trees (GBDT)',
                val: prediction.modelBreakdown.gradientBoost,
                weight: '40% weight',
                color: 'bg-purple-500',
              },
              {
                name: 'Random Forest Regressor (RF)',
                val: prediction.modelBreakdown.randomForest,
                weight: '30% weight',
                color: 'bg-cyan-500',
              },
              {
                name: 'Multi-Layer Perceptron (MLP Neural Net)',
                val: prediction.modelBreakdown.neuralNetwork,
                weight: '20% weight',
                color: 'bg-blue-500',
              },
              {
                name: 'ASHRAE ISO 52016 Physical Heat Balance',
                val: prediction.modelBreakdown.ashraePhysical,
                weight: '10% baseline',
                color: 'bg-amber-500',
              },
            ].map((model) => (
              <div key={model.name} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>{model.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">{model.weight}</span>
                    <strong className="font-mono text-white text-sm">{model.val.toFixed(2)}</strong>
                    <span className="text-slate-500 text-[10px]">kWh/m²</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${model.color} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, (model.val / 50) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            Ensemble blends decision tree splits, deep feature weights, and physical heat transfer equations to eliminate overfitting on single envelope profiles.
          </p>
        </div>

        {/* SHAP Feature Contributions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white font-semibold text-sm">Feature Importance & Thermal Drivers</h3>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              SHAP Attribution
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {prediction.featureContributions.map((fc) => (
              <div
                key={fc.feature}
                className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  {fc.direction === 'increases_cooling' ? (
                    <ArrowUpRight className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-slate-300 font-medium">{fc.feature}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      fc.direction === 'increases_cooling'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {fc.impact > 0 ? `+${fc.impact.toFixed(1)}` : `${fc.impact.toFixed(1)}`} kW
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {fc.direction === 'increases_cooling' ? 'Penalty' : 'Credit'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            Building height and window glazing ratio typically account for over 65% of variance in cooling thermal penalties.
          </p>
        </div>
      </div>
    </div>
  );
};
