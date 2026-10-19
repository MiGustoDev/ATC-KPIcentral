import React from 'react';
import { 
  BarChart3, LayoutDashboard, Star, Upload, 
  SlidersHorizontal, Sparkles
} from 'lucide-react';

export function Header({
  activeModule,
  onModuleChange,
  onOpenImport,
  onOpenThresholds
}) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="w-full px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand with official Logo */}
        <div className="flex items-center gap-3.5">
          <img
            src="/Logo_Mi_Gusto_2025.png"
            alt="Mi Gusto"
            className="h-8 sm:h-9 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.2)]"
          />
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                KPI Central
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                Apps & Calidad
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Monitoreo operativo de PedidosYa, Rappi, MDL y Reseñas
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
          <button
            onClick={() => onModuleChange('operational')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeModule === 'operational'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>KPIs Operativos (Apps)</span>
          </button>
          <button
            onClick={() => onModuleChange('reviews')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeModule === 'reviews'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reseñas & Puntuaciones (5 Canales)</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenThresholds}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300 transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Semáforos</span>
          </button>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-400 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Excel</span>
          </button>
        </div>
      </div>
    </header>
  );
}
