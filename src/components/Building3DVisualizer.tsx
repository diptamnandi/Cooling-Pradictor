import React, { useState } from 'react';
import { BuildingFeatures, PredictionResult } from '../utils/mlModels';
import { Sun, Eye, Compass, Flame, ShieldCheck, Layers, Zap, ThermometerSnowflake, Activity, Gauge } from 'lucide-react';

interface Building3DVisualizerProps {
  features: BuildingFeatures;
  prediction: PredictionResult;
  onRunPrediction?: () => void;
  isPredicting?: boolean;
}

export const Building3DVisualizer: React.FC<Building3DVisualizerProps> = ({
  features,
  prediction,
  onRunPrediction,
  isPredicting = false,
}) => {
  const [showSolarFlux, setShowSolarFlux] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [localCalculating, setLocalCalculating] = useState(false);

  const handlePredictClick = () => {
    setLocalCalculating(true);
    if (onRunPrediction) {
      onRunPrediction();
    }
    setTimeout(() => {
      setLocalCalculating(false);
    }, 400);
  };

  // Morph geometry based on building parameters
  const isTwoStory = features.overallHeight >= 5.0;
  const heightRatio = isTwoStory ? 1.7 : 1.0;

  // Compactness affects width/depth ratio (low compactness = elongated, high compactness = cubic)
  const lengthX = Math.round(180 * (0.8 + (1 - features.relativeCompactness) * 0.7));
  const depthY = Math.round(130 * features.relativeCompactness);
  const wallHeight = Math.round(65 * heightRatio);

  // Isometric projection coordinates
  const cx = 260;
  const cy = 250;

  const cos30 = 0.866;
  const sin30 = 0.5;

  const dx1 = lengthX * cos30;
  const dy1 = lengthX * sin30;

  const dx2 = -depthY * cos30;
  const dy2 = depthY * sin30;

  // Isometric corners of bottom base
  const pBottomFront = { x: cx, y: cy };
  const pBottomRight = { x: cx + dx1, y: cy + dy1 };
  const pBottomBack = { x: cx + dx1 + dx2, y: cy + dy1 + dy2 };
  const pBottomLeft = { x: cx + dx2, y: cy + dy2 };

  // Isometric corners of top roof
  const pTopFront = { x: pBottomFront.x, y: pBottomFront.y - wallHeight };
  const pTopRight = { x: pBottomRight.x, y: pBottomRight.y - wallHeight };
  const pTopBack = { x: pBottomBack.x, y: pBottomBack.y - wallHeight };
  const pTopLeft = { x: pBottomLeft.x, y: pBottomLeft.y - wallHeight };

  // Center of roof for solar heat flux vector
  const roofCenterX = (pTopFront.x + pTopRight.x + pTopBack.x + pTopLeft.x) / 4;
  const roofCenterY = (pTopFront.y + pTopRight.y + pTopBack.y + pTopLeft.y) / 4;

  // Thermal heat color based on cooling load
  const heatIntensity = Math.min(1, Math.max(0, (prediction.coolingLoad - 15) / 28));

  // Dynamic wall colors
  const southWallColor = heatIntensity > 0.6 ? '#f87171' : heatIntensity > 0.3 ? '#fbbf24' : '#60a5fa';
  const eastWallColor = heatIntensity > 0.6 ? '#ef4444' : heatIntensity > 0.3 ? '#f59e0b' : '#3b82f6';
  const roofColor = heatIntensity > 0.6 ? '#b91c1c' : heatIntensity > 0.3 ? '#d97706' : '#2563eb';

  const glazingPercent = Math.round(features.glazingArea * 100);
  const windowCount = Math.max(1, Math.round(features.glazingArea * 10));

  const sunCoordinates: Record<number, { x: number; y: number; label: string }> = {
    2: { x: 120, y: 70, label: 'North Sun (Indirect)' },
    3: { x: 420, y: 80, label: 'East Sun (Morning Radiance)' },
    4: { x: 100, y: 340, label: 'South Sun (Peak Noon Radiance)' },
    5: { x: 430, y: 350, label: 'West Sun (Afternoon Solar Gain)' },
  };

  const currentSun = sunCoordinates[features.orientation] || sunCoordinates[4];
  const calculating = isPredicting || localCalculating;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Top Controls Bar with Prediction Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-white font-semibold text-base tracking-wide flex items-center gap-2">
              Building Envelope Thermal Twin
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              3D Dynamic Isometric
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTwoStory ? '2 Stories (7.0m)' : 'Single Story (3.5m)'} • {features.roofArea} m² footprint • {glazingPercent}% Glazing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Prominent Run Prediction Button */}
          <button
            onClick={handlePredictClick}
            disabled={calculating}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            title="Execute 4-Model ML prediction ensemble on current building envelope"
          >
            <Zap className={`w-3.5 h-3.5 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Computing ML...' : 'Run ML Load Prediction'}
          </button>

          <button
            onClick={() => setShowSolarFlux(!showSolarFlux)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showSolarFlux
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle solar irradiance & heat flux vectors"
          >
            <Sun className="w-3.5 h-3.5" />
            Solar Flux
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showDimensions
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle dimensions & physical metrics overlay"
          >
            <Layers className="w-3.5 h-3.5" />
            Dimensions
          </button>
        </div>
      </div>

      {/* Prominent Real-Time Prediction Summary Strip on the 3D Twin */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2 z-10">
        <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-semibold tracking-wider block">
              Predicted Cooling (Y₂)
            </span>
            <span className="text-xl font-extrabold text-white font-mono">
              {prediction.coolingLoad.toFixed(2)}{' '}
              <span className="text-[11px] text-slate-400 font-sans font-normal">kWh/m²</span>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {prediction.energyEfficiencyRating}
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider block">
              Predicted Heating (Y₁)
            </span>
            <span className="text-xl font-extrabold text-white font-mono">
              {prediction.heatingLoad.toFixed(2)}{' '}
              <span className="text-[11px] text-slate-400 font-sans font-normal">kWh/m²</span>
            </span>
          </div>
          <Flame className="w-4 h-4 text-amber-400" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider block">
              Peak Thermal Demand
            </span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {prediction.coolingLoadTotalKW}{' '}
              <span className="text-[11px] text-slate-400 font-sans font-normal">kW</span>
            </span>
          </div>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-semibold tracking-wider block">
              HVAC Sizing Required
            </span>
            <span className="text-xl font-extrabold text-cyan-300 font-mono">
              {prediction.hvacTonnageTR.toFixed(1)}{' '}
              <span className="text-[11px] text-slate-400 font-sans font-normal">TR</span>
            </span>
          </div>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* 3D SVG Projection Stage */}
      <div className="relative w-full h-[370px] flex items-center justify-center my-1">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        {/* Scanline overlay during calculation */}
        {calculating && (
          <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none z-20 flex flex-col items-center justify-center backdrop-blur-[1px] animate-pulse">
            <div className="bg-slate-950/90 border border-cyan-500/60 rounded-xl px-4 py-2 flex items-center gap-2 text-cyan-300 text-xs font-mono shadow-2xl">
              <Zap className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Running Ensemble Model Inferences...</span>
            </div>
          </div>
        )}

        {/* Dynamic SVG Visualizer */}
        <svg
          viewBox="0 0 520 440"
          className="w-full h-full max-h-[370px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Heat Gradient for Roof */}
            <linearGradient id="roofHeatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={roofColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* Left Facade Gradient (South/West) */}
            <linearGradient id="leftFacadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={southWallColor} stopOpacity="0.80" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.90" />
            </linearGradient>

            {/* Right Facade Gradient (East/North) */}
            <linearGradient id="rightFacadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={eastWallColor} stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.92" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Compass Rose */}
          <g transform="translate(450, 60)">
            <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="0" y="-12" textAnchor="middle" className="text-[10px] font-bold fill-red-400">N (2)</text>
            <text x="18" y="4" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">E (3)</text>
            <text x="0" y="20" textAnchor="middle" className="text-[10px] font-bold fill-amber-400">S (4)</text>
            <text x="-18" y="4" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">W (5)</text>
            {/* Active Orientation Pointer */}
            <circle
              cx={features.orientation === 2 ? 0 : features.orientation === 3 ? 14 : features.orientation === 4 ? 0 : -14}
              cy={features.orientation === 2 ? -14 : features.orientation === 3 ? 0 : features.orientation === 4 ? 14 : 0}
              r="4"
              fill="#38bdf8"
              className="animate-pulse"
            />
          </g>

          {/* Ground Footprint Shadow */}
          <polygon
            points={`
              ${pBottomFront.x},${pBottomFront.y + 12}
              ${pBottomRight.x + 8},${pBottomRight.y + 12}
              ${pBottomBack.x + 4},${pBottomBack.y + 12}
              ${pBottomLeft.x - 4},${pBottomLeft.y + 12}
            `}
            fill="#020617"
            opacity="0.65"
          />

          {/* Left Facade (South-West) */}
          <polygon
            points={`
              ${pBottomFront.x},${pBottomFront.y}
              ${pTopFront.x},${pTopFront.y}
              ${pTopLeft.x},${pTopLeft.y}
              ${pBottomLeft.x},${pBottomLeft.y}
            `}
            fill="url(#leftFacadeGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Right Facade (South-East) */}
          <polygon
            points={`
              ${pBottomFront.x},${pBottomFront.y}
              ${pTopFront.x},${pTopFront.y}
              ${pTopRight.x},${pTopRight.y}
              ${pBottomRight.x},${pBottomRight.y}
            `}
            fill="url(#rightFacadeGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Roof Surface */}
          <polygon
            points={`
              ${pTopFront.x},${pTopFront.y}
              ${pTopRight.x},${pTopRight.y}
              ${pTopBack.x},${pTopBack.y}
              ${pTopLeft.x},${pTopLeft.y}
            `}
            fill="url(#roofHeatGrad)"
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Windows / Glazing on Left Facade */}
          {features.glazingArea > 0 && Array.from({ length: windowCount }).map((_, idx) => {
            const step = (idx + 1) / (windowCount + 1);
            const botX = pBottomFront.x + (pBottomLeft.x - pBottomFront.x) * step;
            const botY = pBottomFront.y + (pBottomLeft.y - pBottomFront.y) * step;
            const topX = pTopFront.x + (pTopLeft.x - pTopFront.x) * step;
            const topY = pTopFront.y + (pTopLeft.y - pTopFront.y) * step;

            const wWidth = 14;
            const wHeight = isTwoStory ? 24 : 16;
            const wCenterY = (botY + topY) / 2;

            return (
              <g key={`win-l-${idx}`}>
                <polygon
                  points={`
                    ${botX - wWidth * cos30},${wCenterY - wHeight / 2}
                    ${botX + wWidth * cos30},${wCenterY - wHeight / 2 - 8}
                    ${botX + wWidth * cos30},${wCenterY + wHeight / 2 - 8}
                    ${botX - wWidth * cos30},${wCenterY + wHeight / 2}
                  `}
                  fill="#38bdf8"
                  opacity="0.85"
                  stroke="#e0f2fe"
                  strokeWidth="1"
                />
                <line
                  x1={botX - 8}
                  y1={wCenterY - 4}
                  x2={botX + 6}
                  y2={wCenterY + 4}
                  stroke="#ffffff"
                  strokeWidth="1"
                  opacity="0.7"
                />
              </g>
            );
          })}

          {/* Windows on Right Facade */}
          {features.glazingArea > 0.15 && Array.from({ length: Math.max(1, Math.floor(windowCount * 0.7)) }).map((_, idx) => {
            const count = Math.max(1, Math.floor(windowCount * 0.7));
            const step = (idx + 1) / (count + 1);
            const botX = pBottomFront.x + (pBottomRight.x - pBottomFront.x) * step;
            const topX = pTopFront.x + (pTopRight.x - pTopFront.x) * step;
            const botY = pBottomFront.y + (pBottomRight.y - pBottomFront.y) * step;
            const topY = pTopFront.y + (pTopRight.y - pTopFront.y) * step;

            const wHeight = isTwoStory ? 22 : 14;
            const wCenterY = (botY + topY) / 2;

            return (
              <polygon
                key={`win-r-${idx}`}
                points={`
                  ${botX - 10},${wCenterY - wHeight / 2}
                  ${botX + 10},${wCenterY - wHeight / 2 + 5}
                  ${botX + 10},${wCenterY + wHeight / 2 + 5}
                  ${botX - 10},${wCenterY + wHeight / 2}
                `}
                fill="#0284c7"
                opacity="0.8"
                stroke="#bae6fd"
                strokeWidth="1"
              />
            );
          })}

          {/* Story divider line if 2-story building */}
          {isTwoStory && (
            <>
              <line
                x1={(pBottomFront.x + pTopFront.x) / 2}
                y1={(pBottomFront.y + pTopFront.y) / 2}
                x2={(pBottomLeft.x + pTopLeft.x) / 2}
                y2={(pBottomLeft.y + pTopLeft.y) / 2}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <line
                x1={(pBottomFront.x + pTopFront.x) / 2}
                y1={(pBottomFront.y + pTopFront.y) / 2}
                x2={(pBottomRight.x + pTopRight.x) / 2}
                y2={(pBottomRight.y + pTopRight.y) / 2}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Sun & Solar Irradiance Ray Vectors */}
          {showSolarFlux && (
            <g>
              <circle
                cx={currentSun.x}
                cy={currentSun.y}
                r="18"
                fill="#f59e0b"
                filter="url(#solarGlow)"
              />
              <circle cx={currentSun.x} cy={currentSun.y} r="14" fill="#fbbf24" />
              <text
                x={currentSun.x}
                y={currentSun.y + 32}
                textAnchor="middle"
                className="text-[11px] font-medium fill-amber-300"
              >
                {currentSun.label}
              </text>

              <line
                x1={currentSun.x}
                y1={currentSun.y}
                x2={roofCenterX}
                y2={roofCenterY}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.75"
              />
              <polygon
                points={`
                  ${roofCenterX},${roofCenterY}
                  ${roofCenterX - 6},${roofCenterY - 12}
                  ${roofCenterX + 6},${roofCenterY - 12}
                `}
                fill="#f59e0b"
              />

              <circle
                cx={roofCenterX}
                cy={roofCenterY}
                r="7"
                fill="#ef4444"
                opacity="0.9"
                className="animate-ping"
              />
              <circle cx={roofCenterX} cy={roofCenterY} r="5" fill="#f87171" />
            </g>
          )}

          {/* Dimension HUD Overlays */}
          {showDimensions && (
            <g className="text-[11px] fill-slate-300 select-none">
              <line
                x1={pBottomFront.x - 20}
                y1={pBottomFront.y}
                x2={pTopFront.x - 20}
                y2={pTopFront.y}
                stroke="#06b6d4"
                strokeWidth="1.5"
              />
              <line
                x1={pBottomFront.x - 26}
                y1={pBottomFront.y}
                x2={pBottomFront.x - 14}
                y2={pBottomFront.y}
                stroke="#06b6d4"
                strokeWidth="1.5"
              />
              <line
                x1={pTopFront.x - 26}
                y1={pTopFront.y}
                x2={pTopFront.x - 14}
                y2={pTopFront.y}
                stroke="#06b6d4"
                strokeWidth="1.5"
              />
              <text
                x={pTopFront.x - 30}
                y={(pBottomFront.y + pTopFront.y) / 2 + 4}
                textAnchor="end"
                className="font-bold fill-cyan-400"
              >
                H = {features.overallHeight}m
              </text>

              <text
                x={roofCenterX}
                y={roofCenterY - 14}
                textAnchor="middle"
                className="font-semibold fill-white text-[12px] bg-slate-950/80 px-2 py-0.5"
              >
                Roof Area: {features.roofArea} m²
              </text>
            </g>
          )}
        </svg>

        {/* Heat Map Legend */}
        <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-2 text-xs text-slate-300 flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Cooling Heat Flux:</span>
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-rose-600"></div>
          <span className="font-semibold text-white">{prediction.coolingLoad.toFixed(2)} kWh/m²</span>
        </div>

        {/* Live ML Prediction Badge */}
        <div className="absolute top-2 right-3 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
            prediction.energyEfficiencyRating.startsWith('A')
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : prediction.energyEfficiencyRating === 'B' || prediction.energyEfficiencyRating === 'C'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}>
            {prediction.energyEfficiencyRating}
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">ASHRAE Tier</div>
            <div className="text-xs font-semibold text-white">
              {prediction.energyEfficiencyRating.startsWith('A') ? 'High Performance' : 'Standard Envelope'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Thermal Metrics Footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Relative Compactness</span>
          <span className="font-bold text-slate-200">{features.relativeCompactness}</span>
          <span className="text-[10px] text-slate-500 block">
            {features.relativeCompactness > 0.8 ? 'Cubic (Efficient)' : 'Elongated (High loss)'}
          </span>
        </div>

        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Envelope Area</span>
          <span className="font-bold text-slate-200">{features.surfaceArea} m²</span>
          <span className="text-[10px] text-slate-500 block">Wall: {features.wallArea} m²</span>
        </div>

        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Solar Aspect</span>
          <span className="font-bold text-amber-300">
            {features.orientation === 2 ? 'North (Low Gain)' : features.orientation === 4 ? 'South (High Gain)' : features.orientation === 5 ? 'West (Peak Heat)' : 'East (Morning)'}
          </span>
          <span className="text-[10px] text-slate-500 block">{glazingPercent}% Window Ratio</span>
        </div>
      </div>
    </div>
  );
};
