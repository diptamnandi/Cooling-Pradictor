import { ThermometerSnowflake, GitCompare, Database, Sparkles, AlertCircle, Building2, Wifi, WifiOff } from 'lucide-react';

export type ActiveTab = 'predictor' | 'scenario' | 'batch' | 'advisor';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDiagnostic: () => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDiagnostic,
  isOnline,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <ThermometerSnowflake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">
                Cooling Load ML Predictor
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                ASHRAE / UCI AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Building envelope thermal simulation &amp; peak HVAC cooling sizing
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('predictor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'predictor'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D Twin &amp;</span> Predictor
          </button>

          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'scenario'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            A/B Retrofit
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'batch'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Batch CSV
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'advisor'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Advisor
          </button>
        </nav>

        {/* Network & Diagnostic Actions */}
        <div className="flex items-center gap-2">
          {/* Live Network Health Status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30'
            }`}
            title={isOnline ? 'Network Connected - All Online & Offline Features Active' : 'Zero-Network Mode - All Local ML & 3D Twins 100% Operational'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-cyan-400" />
                <span>Offline Safe</span>
              </>
            )}
          </div>

          <button
            onClick={onOpenDiagnostic}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Diagnose why cooling-load-ml-predictor.ai.studio link stopped working"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Project Link Diagnostic</span>
            <span className="sm:hidden">Diagnostic</span>
          </button>
        </div>
      </div>
    </header>
  );
};
