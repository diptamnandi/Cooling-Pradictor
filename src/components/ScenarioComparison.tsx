import React, { useState, useMemo } from 'react';
import { BuildingFeatures, PredictionResult, predictBuildingEnergy } from '../utils/mlModels';
import { GitCompare, TrendingDown, DollarSign, Leaf, Zap, ArrowRight, CheckCircle2, Sliders, Activity, Thermometer } from 'lucide-react';

interface ScenarioComparisonProps {
  currentFeatures: BuildingFeatures;
  currentPrediction: PredictionResult;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  currentFeatures,
  currentPrediction,
}) => {
  // Retrofit design state
  const [retrofitFeatures, setRetrofitFeatures] = useState<BuildingFeatures>({
    ...currentFeatures,
    glazingArea: Math.max(0.1, currentFeatures.glazingArea * 0.6),
    orientation: 2, // North orientation (low direct solar)
    relativeCompactness: Math.min(0.95, currentFeatures.relativeCompactness + 0.1),
  });

  const [hoverTemp, setHoverTemp] = useState<number>(35); // Outdoor design temp probe

  const retrofitPrediction = useMemo(() => {
    return predictBuildingEnergy(retrofitFeatures);
  }, [retrofitFeatures]);

  // Delta calculations
  const coolingDeltaKWh = retrofitPrediction.coolingLoad - currentPrediction.coolingLoad;
  const coolingDeltaPercent = Math.round((coolingDeltaKWh / currentPrediction.coolingLoad) * 100);

  const tonnageDelta = retrofitPrediction.hvacTonnageTR - currentPrediction.hvacTonnageTR;
  const costSavings = currentPrediction.annualCostEstimateUSD - retrofitPrediction.annualCostEstimateUSD;
  const carbonSavings = currentPrediction.carbonFootprintKgCO2 - retrofitPrediction.carbonFootprintKgCO2;

  // Generate temperature sensitivity line graph data points (20°C to 42°C)
  const tempSweepData = useMemo(() => {
    const points: Array<{
      temp: number;
      loadA: number;
      loadB: number;
      delta: number;
    }> = [];

    for (let t = 20; t <= 42; t += 2) {
      // Scale load based on ambient outdoor temperature delta relative to 24°C indoor setpoint
      const deltaTFactor = Math.max(0.4, (t - 18) / 14);
      const loadA = Math.round(currentPrediction.coolingLoadTotalKW * deltaTFactor * 10) / 10;
      const loadB = Math.round(retrofitPrediction.coolingLoadTotalKW * deltaTFactor * 10) / 10;
      points.push({
        temp: t,
        loadA,
        loadB,
        delta: Math.round((loadA - loadB) * 10) / 10,
      });
    }
    return points;
  }, [currentPrediction.coolingLoadTotalKW, retrofitPrediction.coolingLoadTotalKW]);

  // SVG Chart dimensions
  const chartW = 760;
  const chartH = 220;
  const padL = 50;
  const padR = 30;
  const padT = 30;
  const padB = 40;

  const maxChartLoad = Math.max(
    ...tempSweepData.map((d) => d.loadA),
    ...tempSweepData.map((d) => d.loadB),
    40
  );

  const getSvgX = (t: number) => {
    return padL + ((t - 20) / (42 - 20)) * (chartW - padL - padR);
  };

  const getSvgY = (load: number) => {
    return padT + (1 - load / (maxChartLoad * 1.15)) * (chartH - padT - padB);
  };

  // Build SVG path strings
  const pathD_A = tempSweepData
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getSvgX(p.temp)} ${getSvgY(p.loadA)}`)
    .join(' ');

  const pathD_B = tempSweepData
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getSvgX(p.temp)} ${getSvgY(p.loadB)}`)
    .join(' ');

  // Shaded polygon between curves
  const pathShadedArea = `${pathD_A} ${tempSweepData
    .slice()
    .reverse()
    .map((p) => `L ${getSvgX(p.temp)} ${getSvgY(p.loadB)}`)
    .join(' ')} Z`;

  // Active probe values
  const currentProbe = tempSweepData.find((p) => p.temp === hoverTemp) || tempSweepData[7];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-bold text-lg">A/B Design &amp; Retrofit Comparison Lab</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare baseline Design A vs proposed Retrofit Design B with interactive digital graphs, temperature sweeps, and architectural leader lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setRetrofitFeatures({
                ...currentFeatures,
                glazingArea: 0.10,
                orientation: 2,
                relativeCompactness: 0.92,
              })
            }
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 font-bold transition-all shadow-sm"
          >
            ⚡ Load Ideal Passive Solar Shading Preset
          </button>
        </div>
      </div>

      {/* Delta Highlights Banner with Digital Leader Lines */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Cooling Reduction */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden ${
            coolingDeltaPercent < 0
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Cooling Load Impact</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight">
              {coolingDeltaPercent < 0 ? `${coolingDeltaPercent}%` : `+${coolingDeltaPercent}%`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>{currentPrediction.coolingLoad.toFixed(1)} kWh</span>
            <span className="text-emerald-400 font-bold">───►</span>
            <span className="font-bold text-white">{retrofitPrediction.coolingLoad.toFixed(1)} kWh</span>
          </div>
        </div>

        {/* HVAC Equipment Downsizing */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>HVAC Sizing Delta</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
              {tonnageDelta < 0 ? `${tonnageDelta.toFixed(1)} TR` : `+${tonnageDelta.toFixed(1)} TR`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>{currentPrediction.hvacTonnageTR.toFixed(1)} TR</span>
            <span className="text-cyan-400 font-bold">───►</span>
            <span className="font-bold text-white">{retrofitPrediction.hvacTonnageTR.toFixed(1)} TR</span>
          </div>
        </div>

        {/* Annual Utility Savings */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Annual Utility Savings</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
              ${costSavings > 0 ? costSavings.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400"> / year</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>${currentPrediction.annualCostEstimateUSD.toLocaleString()}</span>
            <span className="text-amber-400 font-bold">───►</span>
            <span className="font-bold text-white">${retrofitPrediction.annualCostEstimateUSD.toLocaleString()}</span>
          </div>
        </div>

        {/* Carbon Abatement */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Carbon Abatement</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {carbonSavings > 0 ? carbonSavings.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-400"> kg CO₂/yr</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>{currentPrediction.carbonFootprintKgCO2.toLocaleString()} kg</span>
            <span className="text-emerald-400 font-bold">───►</span>
            <span className="font-bold text-white">{retrofitPrediction.carbonFootprintKgCO2.toLocaleString()} kg</span>
          </div>
        </div>
      </div>

      {/* GRAPH 1: Interactive Temperature Sensitivity Dual-Line Graph with Digital Shading */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-white font-bold text-sm">
              Digital Line Graph: Cooling Load vs. Outdoor Dry-Bulb Temperature (20°C - 42°C)
            </h4>
          </div>

          {/* Interactive Temperature Slider Probe */}
          <div className="flex items-center gap-3 text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              Design Temp Probe:
            </span>
            <input
              type="range"
              min="20"
              max="42"
              step="2"
              value={hoverTemp}
              onChange={(e) => setHoverTemp(parseInt(e.target.value, 10))}
              className="accent-cyan-400 w-28 cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-300">{hoverTemp}°C</span>
          </div>
        </div>

        {/* Dynamic Digital Line Graph SVG */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[650px] select-none h-60">
            <defs>
              <linearGradient id="savingsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = padT + (1 - ratio) * (chartH - padT - padB);
              const val = Math.round(ratio * maxChartLoad * 1.15);
              return (
                <g key={ratio}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={chartW - padR}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {val} kW
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines (temperatures) */}
            {tempSweepData.map((d) => {
              const x = getSvgX(d.temp);
              return (
                <g key={d.temp}>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={chartH - padB}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                  />
                  <text
                    x={x}
                    y={chartH - padB + 14}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {d.temp}°C
                  </text>
                </g>
              );
            })}

            {/* Shaded Area between curves (Avoided Thermal Ingress) */}
            <path d={pathShadedArea} fill="url(#savingsAreaGrad)" />

            {/* Curve A: Baseline (Amber dashed digital line) */}
            <path
              d={pathD_A}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />

            {/* Curve B: Retrofit (Cyan solid glowing line) */}
            <path
              d={pathD_B}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Nodes on Curve A */}
            {tempSweepData.map((d) => (
              <circle
                key={`a-${d.temp}`}
                cx={getSvgX(d.temp)}
                cy={getSvgY(d.loadA)}
                r="3"
                fill="#fbbf24"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            ))}

            {/* Nodes on Curve B */}
            {tempSweepData.map((d) => (
              <circle
                key={`b-${d.temp}`}
                cx={getSvgX(d.temp)}
                cy={getSvgY(d.loadB)}
                r="4"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            ))}

            {/* Active Probe Vertical Crosshair Line */}
            {currentProbe && (
              <g>
                <line
                  x1={getSvgX(currentProbe.temp)}
                  y1={padT}
                  x2={getSvgX(currentProbe.temp)}
                  y2={chartH - padB}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Probe Tag callout */}
                <circle
                  cx={getSvgX(currentProbe.temp)}
                  cy={getSvgY(currentProbe.loadA)}
                  r="6"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={getSvgX(currentProbe.temp)}
                  cy={getSvgY(currentProbe.loadB)}
                  r="6"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Callout box */}
                <rect
                  x={Math.min(chartW - 170, Math.max(padL + 10, getSvgX(currentProbe.temp) - 80))}
                  y={padT + 4}
                  width="160"
                  height="36"
                  rx="6"
                  fill="#020617"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(chartW - 170, Math.max(padL + 10, getSvgX(currentProbe.temp) - 80)) + 80}
                  y={padT + 17}
                  textAnchor="middle"
                  className="text-[9.5px] fill-white font-mono font-bold"
                >
                  {currentProbe.temp}°C: A = {currentProbe.loadA}kW vs B = {currentProbe.loadB}kW
                </text>
                <text
                  x={Math.min(chartW - 170, Math.max(padL + 10, getSvgX(currentProbe.temp) - 80)) + 80}
                  y={padT + 30}
                  textAnchor="middle"
                  className="text-[9.5px] fill-emerald-400 font-mono font-bold"
                >
                  Thermal Ingress Avoided: -{currentProbe.delta} kW
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-1 border-t-2 border-dashed border-amber-400 inline-block"></span>
              <strong className="text-amber-300">Design A (Baseline)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-cyan-400 inline-block rounded-full"></span>
              <strong className="text-cyan-400">Design B (Retrofit)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/30 border border-emerald-500/50 rounded inline-block"></span>
              <span className="text-emerald-400">Avoided Heat Load</span>
            </span>
          </div>

          <div className="font-mono text-xs text-slate-300">
            Probe at <strong className="text-white">{currentProbe.temp}°C</strong>: Saved{' '}
            <strong className="text-emerald-400">{currentProbe.delta} kW</strong> (
            {Math.round((currentProbe.delta / 3.517) * 10) / 10} TR)
          </div>
        </div>
      </div>

      {/* Side-by-Side Digital Metric Bars with Architectural Connecting Lines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Design A: Current Baseline */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                [ MODEL A : BASELINE ]
              </span>
              <h4 className="text-white font-bold text-base">Current Building Geometry</h4>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-semibold">
              Tier {currentPrediction.energyEfficiencyRating}
            </span>
          </div>

          {/* Metric Digital Bars */}
          <div className="flex flex-col gap-3 text-xs">
            {/* Cooling Load */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Cooling Load (Y₂)</span>
                <span className="font-mono font-bold text-white">
                  {currentPrediction.coolingLoad.toFixed(2)} kWh/m²
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentPrediction.coolingLoad / 50) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Heating Load */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Heating Load (Y₁)</span>
                <span className="font-mono font-bold text-slate-300">
                  {currentPrediction.heatingLoad.toFixed(2)} kWh/m²
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (currentPrediction.heatingLoad / 45) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Peak Thermal Power */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Peak Thermal Capacity</span>
                <span className="font-mono font-bold text-cyan-300">
                  {currentPrediction.coolingLoadTotalKW} kW ({currentPrediction.hvacTonnageTR.toFixed(1)} TR)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (currentPrediction.hvacTonnageTR / 50) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Digital HUD Lines for Envelope Parameters */}
          <div className="text-xs text-slate-400 flex flex-col gap-2 pt-3 border-t border-slate-800 font-mono">
            <div className="flex items-center justify-between">
              <span>Glazing Area (X₇):</span>
              <span className="text-white font-bold">{Math.round(currentFeatures.glazingArea * 100)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Solar Orientation (X₆):</span>
              <span className="text-white font-bold">
                {['', '', 'North (2)', 'East (3)', 'South (4)', 'West (5)'][currentFeatures.orientation]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compactness Ratio (X₁):</span>
              <span className="text-white font-bold">{currentFeatures.relativeCompactness}</span>
            </div>
          </div>
        </div>

        {/* Design B: Proposed Retrofit */}
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                [ MODEL B : OPTIMIZED RETROFIT ]
              </span>
              <h4 className="text-white font-bold text-base">Proposed Passive Retrofit</h4>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold">
              Tier {retrofitPrediction.energyEfficiencyRating}
            </span>
          </div>

          {/* Metric Digital Bars with comparison */}
          <div className="flex flex-col gap-3 text-xs">
            {/* Cooling Load with Delta line */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Cooling Load (Y₂)</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-emerald-400 font-bold">
                    {retrofitPrediction.coolingLoad.toFixed(2)} kWh/m²
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {coolingDeltaPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (retrofitPrediction.coolingLoad / 50) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Heating Load */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Heating Load (Y₁)</span>
                <span className="font-mono font-bold text-slate-300">
                  {retrofitPrediction.heatingLoad.toFixed(2)} kWh/m²
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (retrofitPrediction.heatingLoad / 45) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Peak Thermal Power with Delta */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Peak Thermal Capacity</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-cyan-300">
                    {retrofitPrediction.coolingLoadTotalKW} kW ({retrofitPrediction.hvacTonnageTR.toFixed(1)} TR)
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                    {tonnageDelta.toFixed(1)} TR
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (retrofitPrediction.hvacTonnageTR / 50) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Interactive controls for Retrofit */}
          <div className="flex flex-col gap-3 pt-3 border-t border-emerald-500/20 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-mono">Retrofit Glazing (X₇):</span>
              <div className="flex gap-1">
                {[0.0, 0.1, 0.25, 0.4].map((g) => (
                  <button
                    key={g}
                    onClick={() => setRetrofitFeatures({ ...retrofitFeatures, glazingArea: g })}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      Math.abs(retrofitFeatures.glazingArea - g) < 0.01
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {Math.round(g * 100)}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-mono">Retrofit Orientation (X₆):</span>
              <div className="flex gap-1">
                {[
                  { code: 2, label: 'N' },
                  { code: 3, label: 'E' },
                  { code: 4, label: 'S' },
                  { code: 5, label: 'W' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setRetrofitFeatures({ ...retrofitFeatures, orientation: item.code })}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      retrofitFeatures.orientation === item.code
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
