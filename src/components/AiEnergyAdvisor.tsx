import React, { useState } from 'react';
import { BuildingFeatures, PredictionResult } from '../utils/mlModels';
import { generateOfflineAshraeAdvice, ADVISOR_TOPICS, AdvisorTopicDefinition } from '../utils/localAdvisor';
import { Sparkles, Bot, ShieldCheck, Loader2, RefreshCw, Copy, Check, WifiOff, CheckSquare, Square, Layers, Flame, Sliders } from 'lucide-react';

interface AiEnergyAdvisorProps {
  features: BuildingFeatures;
  prediction: PredictionResult;
}

export const AiEnergyAdvisor: React.FC<AiEnergyAdvisorProps> = ({ features, prediction }) => {
  const [loading, setLoading] = useState(false);
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [source, setSource] = useState<string>('ready');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // User-selected inquiry points (defaults to top 4 key architectural items)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'thermal_bottleneck',
    'glazing_shading',
    'cool_roof',
    'hvac_sizing',
  ]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(id)) {
        // Keep at least 1 topic selected
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllTopics = () => {
    setSelectedTopics(ADVISOR_TOPICS.map((t) => t.id));
  };

  const applyPreset = (preset: 'envelope' | 'mechanical' | 'economics') => {
    if (preset === 'envelope') {
      setSelectedTopics(['thermal_bottleneck', 'glazing_shading', 'cool_roof', 'wall_insulation']);
    } else if (preset === 'mechanical') {
      setSelectedTopics(['hvac_sizing', 'economizer']);
    } else {
      setSelectedTopics(['energy_economics', 'ashrae_compliance']);
    }
  };

  const fetchAdvice = async () => {
    setLoading(true);
    setIsOfflineMode(false);

    // If client is offline, directly use local expert engine with selected topics
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const localAdvice = generateOfflineAshraeAdvice(features, prediction, selectedTopics);
      setAdviceText(localAdvice);
      setSource('Local ASHRAE Physics Engine');
      setIsOfflineMode(true);
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('/api/gemini-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingFeatures: features,
          predictionResult: prediction,
          selectedTopics,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.advice) {
        setAdviceText(data.advice);
        setSource(data.source || 'gemini');
        setIsOfflineMode(false);
      } else {
        throw new Error('No advice returned');
      }
    } catch {
      // Seamless offline fallback with selected topics
      const fallbackAdvice = generateOfflineAshraeAdvice(features, prediction, selectedTopics);
      setAdviceText(fallbackAdvice);
      setSource('Local ASHRAE Physics Engine (Offline Safe)');
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  const copyAdvice = () => {
    if (!adviceText) return;
    navigator.clipboard.writeText(adviceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-lg">AI Building Energy &amp; HVAC Advisor</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
              Targeted Inquiry Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Select the specific engineering points below you want the AI to analyze. The model will focus strictly on your chosen parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {adviceText && (
            <button
              onClick={copyAdvice}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Report'}
            </button>
          )}

          <button
            onClick={fetchAdvice}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Analyzing Selected Points...
              </>
            ) : adviceText ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Analyze {selectedTopics.length} Point{selectedTopics.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-slate-950" />
                Generate Targeted Assessment ({selectedTopics.length} Selected)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selectable Inquiry Points Grid */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Select Focus Points for AI Prediction:</span>
            <span className="text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
              {selectedTopics.length} / {ADVISOR_TOPICS.length} Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={selectAllTopics}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40"
            >
              Select All
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => applyPreset('envelope')}
              className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700"
            >
              Envelope Only
            </button>
            <button
              onClick={() => applyPreset('mechanical')}
              className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700"
            >
              HVAC &amp; Economizer
            </button>
            <button
              onClick={() => applyPreset('economics')}
              className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700"
            >
              Economics &amp; Carbon
            </button>
          </div>
        </div>

        {/* Multi-Select Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {ADVISOR_TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {topic.label}
                  </span>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block opacity-85 leading-relaxed">
                  {topic.shortDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Offline Mode Alert when active */}
      {isOfflineMode && (
        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Zero-Network Local Mode Active:</strong> Generated using the in-browser ASHRAE physical thermal twin with full engineering rules.
            </span>
          </div>
          <span className="text-[10px] bg-cyan-900/50 px-2 py-0.5 rounded font-mono">100% Offline Safe</span>
        </div>
      )}

      {/* Main Content Area */}
      {adviceText ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Engine: <strong className="text-slate-200">{source.replace('_', ' ').toUpperCase()}</strong>
            </span>
            <div className="flex items-center gap-3">
              <span>Analyzed Points: <strong className="text-cyan-400 font-mono">{selectedTopics.length}</strong></span>
              <span>Target Cooling Load: <strong className="text-cyan-400 font-mono">{prediction.coolingLoad} kWh/m²</strong></span>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-800 text-slate-300 text-xs leading-relaxed space-y-4 font-sans shadow-inner">
            {adviceText.split('\n').filter((l) => l.trim().length > 0).map((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base font-bold text-white pt-1 text-cyan-300 border-b border-slate-800 pb-2">
                    {trimmed.replace(/^###\s*/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-sm font-semibold text-white pt-3 pb-1 border-b border-slate-800/60 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {trimmed.replace(/^####\s*/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
                return (
                  <p key={idx} className="text-slate-400 italic text-[11px]">
                    {trimmed.replace(/^\*+|\*+$/g, '')}
                  </p>
                );
              }
              if (trimmed.startsWith('- ')) {
                const bulletText = trimmed.substring(2);
                // Parse bold segments **text**
                const parts = bulletText.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <div key={idx} className="flex items-start gap-2.5 pl-2 text-slate-300">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">
                      {parts.map((p, pIdx) => {
                        if (p.startsWith('**') && p.endsWith('**')) {
                          return (
                            <strong key={pIdx} className="text-white font-semibold">
                              {p.slice(2, -2)}
                            </strong>
                          );
                        }
                        return p;
                      })}
                    </span>
                  </div>
                );
              }
              // Normal line
              const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={idx} className="text-slate-300 leading-relaxed">
                  {parts.map((p, pIdx) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="text-white font-semibold">
                          {p.slice(2, -2)}
                        </strong>
                      );
                    }
                    return p;
                  })}
                </p>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/40 rounded-xl p-8 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Select Your Focus Points &amp; Generate</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Currently {selectedTopics.length} point{selectedTopics.length > 1 ? 's' : ''} selected. Click below to generate an architectural engineering evaluation exclusively covering your selected topics.
            </p>
          </div>
          <button
            onClick={fetchAdvice}
            className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Selected Points Now
          </button>
        </div>
      )}
    </div>
  );
};
