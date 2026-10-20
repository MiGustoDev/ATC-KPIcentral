import React, { useState, useMemo, useRef } from 'react';
import { 
  Star, TrendingUp, AlertTriangle, 
  MessageSquare, Plus, ArrowUpRight, ArrowDownRight,
  Search
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { REVIEW_CHANNELS } from '../config';
import { AnimatedCounter } from './AnimatedCounter';
import { ModalWrapper } from './ModalWrapper';
import { CustomSelect } from './CustomSelect';

// Initial synthetic monthly reviews structure covering 5 channels
export const INITIAL_REVIEWS_DATA = {
  'Octubre 2026': [
    { tienda: 'Las Cañitas', canal: 'PedidosYa', score: 4.8, prevScore: 4.7, count: 142, prevCount: 130 },
    { tienda: 'Las Cañitas', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 88, prevCount: 75 },
    { tienda: 'Las Cañitas', canal: 'Mercado Delivery', score: 4.9, prevScore: 4.8, count: 45, prevCount: 40 },
    { tienda: 'Las Cañitas', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 62, prevCount: 50 },
    { tienda: 'Las Cañitas', canal: 'Google', score: 4.6, prevScore: 4.6, count: 35, prevCount: 30 },

    { tienda: 'Caballito', canal: 'PedidosYa', score: 4.6, prevScore: 4.8, count: 210, prevCount: 195 },
    { tienda: 'Caballito', canal: 'Rappi', score: 4.5, prevScore: 4.7, count: 120, prevCount: 115 },
    { tienda: 'Caballito', canal: 'Mercado Delivery', score: 4.7, prevScore: 4.7, count: 55, prevCount: 50 },
    { tienda: 'Caballito', canal: 'TePido', score: 4.6, prevScore: 4.6, count: 80, prevCount: 70 },
    { tienda: 'Caballito', canal: 'Google', score: 4.4, prevScore: 4.5, count: 60, prevCount: 55 },

    { tienda: 'Palermo', canal: 'PedidosYa', score: 4.7, prevScore: 4.6, count: 180, prevCount: 160 },
    { tienda: 'Palermo', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 95, prevCount: 90 },
    { tienda: 'Palermo', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.8, count: 40, prevCount: 38 },
    { tienda: 'Palermo', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 70, prevCount: 65 },
    { tienda: 'Palermo', canal: 'Google', score: 4.5, prevScore: 4.4, count: 48, prevCount: 40 },

    { tienda: 'Belgrano', canal: 'PedidosYa', score: 4.6, prevScore: 4.7, count: 165, prevCount: 150 },
    { tienda: 'Belgrano', canal: 'Rappi', score: 4.5, prevScore: 4.6, count: 85, prevCount: 80 },
    { tienda: 'Belgrano', canal: 'Mercado Delivery', score: 4.7, prevScore: 4.7, count: 32, prevCount: 30 },
    { tienda: 'Belgrano', canal: 'TePido', score: 4.6, prevScore: 4.5, count: 54, prevCount: 50 },
    { tienda: 'Belgrano', canal: 'Google', score: 4.3, prevScore: 4.4, count: 42, prevCount: 38 },

    { tienda: 'Martínez', canal: 'PedidosYa', score: 4.7, prevScore: 4.7, count: 130, prevCount: 125 },
    { tienda: 'Martínez', canal: 'Rappi', score: 4.6, prevScore: 4.6, count: 70, prevCount: 68 },
    { tienda: 'Martínez', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.7, count: 28, prevCount: 25 },
    { tienda: 'Martínez', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 48, prevCount: 45 },
    { tienda: 'Martínez', canal: 'Google', score: 4.5, prevScore: 4.4, count: 38, prevCount: 35 },

    { tienda: 'Ituzaingó', canal: 'PedidosYa', score: 4.3, prevScore: 4.6, count: 175, prevCount: 160 },
    { tienda: 'Ituzaingó', canal: 'Rappi', score: 4.2, prevScore: 4.5, count: 40, prevCount: 38 },
    { tienda: 'Ituzaingó', canal: 'Mercado Delivery', score: 4.5, prevScore: 4.6, count: 25, prevCount: 22 },
    { tienda: 'Ituzaingó', canal: 'TePido', score: 4.4, prevScore: 4.5, count: 50, prevCount: 48 },
    { tienda: 'Ituzaingó', canal: 'Google', score: 4.1, prevScore: 4.3, count: 52, prevCount: 45 },

    { tienda: 'Villa Urquiza', canal: 'PedidosYa', score: 4.7, prevScore: 4.6, count: 155, prevCount: 140 },
    { tienda: 'Villa Urquiza', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 80, prevCount: 75 },
    { tienda: 'Villa Urquiza', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.8, count: 30, prevCount: 28 },
    { tienda: 'Villa Urquiza', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 65, prevCount: 60 },
    { tienda: 'Villa Urquiza', canal: 'Google', score: 4.6, prevScore: 4.5, count: 44, prevCount: 40 },

    { tienda: 'Devoto', canal: 'PedidosYa', score: 4.8, prevScore: 4.7, count: 140, prevCount: 135 },
    { tienda: 'Devoto', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 75, prevCount: 70 },
    { tienda: 'Devoto', canal: 'Mercado Delivery', score: 4.9, prevScore: 4.8, count: 22, prevCount: 20 },
    { tienda: 'Devoto', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 58, prevCount: 52 },
    { tienda: 'Devoto', canal: 'Google', score: 4.6, prevScore: 4.5, count: 36, prevCount: 32 }
  ],
  'Septiembre 2026': [
    { tienda: 'Las Cañitas', canal: 'PedidosYa', score: 4.7, prevScore: 4.6, count: 130, prevCount: 120 },
    { tienda: 'Las Cañitas', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 75, prevCount: 70 },
    { tienda: 'Las Cañitas', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.7, count: 40, prevCount: 35 },
    { tienda: 'Las Cañitas', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 50, prevCount: 45 },
    { tienda: 'Las Cañitas', canal: 'Google', score: 4.6, prevScore: 4.5, count: 30, prevCount: 25 },
    { tienda: 'Caballito', canal: 'PedidosYa', score: 4.8, prevScore: 4.7, count: 195, prevCount: 185 },
    { tienda: 'Caballito', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 115, prevCount: 110 }
  ]
};

export function ReviewsDashboard({ supervisors, stores }) {
  const [reviewsData, setReviewsData] = useState(() => {
    const saved = localStorage.getItem('mg_kpi_reviews_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_REVIEWS_DATA;
  });

  const [selectedMonth, setSelectedMonth] = useState('Octubre 2026');
  const [selectedCanal, setSelectedCanal] = useState('ALL');
  const [selectedSup, setSelectedSup] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const reviewsContainerRef = useRef(null);

  // GSAP animation for filter bar and metrics cards
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        '.rev-filter-bar',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 }
      ).fromTo(
        '.rev-metric-card',
        { opacity: 0, y: 14, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05 },
        '-=0.2'
      ).fromTo(
        '.rev-table-container',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.38 },
        '-=0.2'
      );
    },
    { scope: reviewsContainerRef, dependencies: [selectedMonth, selectedCanal, selectedSup] }
  );

  // New review form state
  const [newForm, setNewForm] = useState({
    tienda: stores[0]?.name || '',
    canal: 'PedidosYa',
    score: 4.7,
    count: 100,
    prevScore: 4.6
  });

  // Store & Sup maps
  const storeMap = useMemo(() => {
    const m = {};
    stores.forEach((s) => (m[s.name.toLowerCase()] = s.sup));
    return m;
  }, [stores]);

  const supervisorMap = useMemo(() => {
    const m = {};
    supervisors.forEach((s) => (m[s.id] = s));
    return m;
  }, [supervisors]);

  // Current month items
  const monthItems = reviewsData[selectedMonth] || [];

  // Filtered items
  const filteredItems = useMemo(() => {
    return monthItems.filter((item) => {
      if (selectedCanal !== 'ALL' && item.canal !== selectedCanal) return false;
      const supId = storeMap[item.tienda.toLowerCase()];
      if (selectedSup !== 'ALL' && supId !== selectedSup) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!item.tienda.toLowerCase().includes(q) && !item.canal.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [monthItems, selectedCanal, selectedSup, searchTerm, storeMap]);

  // Global summaries
  const summary = useMemo(() => {
    if (filteredItems.length === 0) return { avgScore: 0, totalReviews: 0, dropCount: 0 };
    const totalReviews = filteredItems.reduce((acc, r) => acc + (r.count || 0), 0);
    const weightedScoreSum = filteredItems.reduce((acc, r) => acc + (r.score * (r.count || 1)), 0);
    const weightedCount = filteredItems.reduce((acc, r) => acc + (r.count || 1), 0);
    const avgScore = weightedCount > 0 ? weightedScoreSum / weightedCount : 0;
    
    // Check drops (score < prevScore by 0.15 or more)
    const dropCount = filteredItems.filter((r) => r.prevScore && (r.prevScore - r.score) >= 0.15).length;

    return {
      avgScore: avgScore.toFixed(2),
      totalReviews,
      dropCount
    };
  }, [filteredItems]);

  const handleSaveReview = (e) => {
    e.preventDefault();
    const updated = { ...reviewsData };
    if (!updated[selectedMonth]) updated[selectedMonth] = [];
    
    const existingIdx = updated[selectedMonth].findIndex(
      (r) => r.tienda.toLowerCase() === newForm.tienda.toLowerCase() && r.canal === newForm.canal
    );

    const record = {
      tienda: newForm.tienda,
      canal: newForm.canal,
      score: parseFloat(newForm.score),
      prevScore: parseFloat(newForm.prevScore),
      count: parseInt(newForm.count, 10),
      prevCount: Math.round(parseInt(newForm.count, 10) * 0.9)
    };

    if (existingIdx >= 0) {
      updated[selectedMonth][existingIdx] = record;
    } else {
      updated[selectedMonth].push(record);
    }

    setReviewsData(updated);
    localStorage.setItem('mg_kpi_reviews_v2', JSON.stringify(updated));
    setShowAddModal(false);
  };

  return (
    <div ref={reviewsContainerRef} className="space-y-5 w-full">
      {/* Filter Bar */}
      <div className="rev-filter-bar relative z-30 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Month */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mes:</span>
              <CustomSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={Object.keys(reviewsData).map((m) => ({ value: m, label: m }))}
                placeholder="Seleccionar mes"
                className="w-44 sm:w-52"
              />
            </div>

            {/* Canal Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canal:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setSelectedCanal('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCanal === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos (5)
                </button>
                {REVIEW_CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCanal(c.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedCanal === c.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supervisora */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Supervisora:</span>
              <CustomSelect
                value={selectedSup}
                onChange={setSelectedSup}
                options={[
                  { value: 'ALL', label: 'Todas las Supervisoras' },
                  ...supervisors.map((s) => ({
                    value: s.id,
                    label: s.name,
                    color: s.color
                  }))
                ]}
                placeholder="Seleccionar supervisora"
                className="w-52 sm:w-60"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all w-44 sm:w-52"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Carga Mensual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row with GSAP Stagger and Animated Counters */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-numbers">
        {/* Puntuación Promedio */}
        <div className="rev-metric-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Puntuación Promedio General</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-2">
            <AnimatedCounter value={parseFloat(summary.avgScore) || 0} decimals={2} />
            <span className="text-sm font-semibold text-slate-500">/ 5.00</span>
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Ponderado por volumen de reseñas</div>
        </div>

        {/* Reseñas Nuevas */}
        <div className="rev-metric-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Total Nuevas Reseñas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            <AnimatedCounter value={summary.totalReviews} decimals={0} />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Relevadas en el mes actual</div>
        </div>

        {/* Alertas de Caída */}
        <div className="rev-metric-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Alertas por Caída de Calificación</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.dropCount > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${summary.dropCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            <AnimatedCounter value={summary.dropCount} decimals={0} />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Sucursales con baja &ge; 0.15 pts</div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rev-table-container bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-white">
            Puntuaciones Relevadas ({filteredItems.length} registros)
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            PedidosYa • Rappi • Mercado Delivery • TePido • Google Maps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/95 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3.5">Canal</th>
                <th className="p-3.5">Sucursal</th>
                <th className="p-3.5">Supervisora</th>
                <th className="p-3.5 text-right">Puntuación</th>
                <th className="p-3.5 text-right">Mes Anterior</th>
                <th className="p-3.5 text-right">Variación</th>
                <th className="p-3.5 text-right">Reseñas Nuevas</th>
                <th className="p-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {filteredItems.map((item, idx) => {
                const supId = storeMap[item.tienda.toLowerCase()];
                const sup = supervisorMap[supId];
                const diff = item.prevScore ? (item.score - item.prevScore) : 0;
                const isDrop = diff < -0.15;
                const isGain = diff > 0.05;

                return (
                  <tr key={`${item.tienda}-${item.canal}-${idx}`} className="rev-row-anim hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-sans">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-slate-800 text-slate-300 border-slate-700">
                        {item.canal}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans font-bold text-white">{item.tienda}</td>
                    <td className="p-3.5 font-sans">
                      {sup ? (
                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                          {sup.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-black text-white">
                      <div className="inline-flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 text-xs">
                      {item.prevScore ? item.prevScore.toFixed(1) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {item.prevScore ? (
                        <div className={`inline-flex items-center gap-0.5 text-xs ${
                          diff < 0 ? 'text-rose-400' : diff > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : diff < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          <span>{diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-200">
                      {item.count.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-center font-sans">
                      {isDrop ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Alerta Caída
                        </span>
                      ) : isGain ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <TrendingUp className="w-3 h-3" />
                          En alza
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Estable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Carga Mensual */}
      <ModalWrapper
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Carga Mensual de Puntuación
        </h3>
        <p className="text-xs text-slate-400">
          Registra la puntuación y volumen de reseñas de la sucursal para el mes seleccionado.
        </p>

        <form onSubmit={handleSaveReview} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-300">Sucursal:</label>
            <select
              value={newForm.tienda}
              onChange={(e) => setNewForm({ ...newForm, tienda: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Canal:</label>
            <select
              value={newForm.canal}
              onChange={(e) => setNewForm({ ...newForm, canal: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {REVIEW_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Puntuación Actual (1-5):</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newForm.score}
                onChange={(e) => setNewForm({ ...newForm, score: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Mes Anterior:</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newForm.prevScore}
                onChange={(e) => setNewForm({ ...newForm, prevScore: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Nuevas Reseñas Recibidas:</label>
            <input
              type="number"
              min="0"
              value={newForm.count}
              onChange={(e) => setNewForm({ ...newForm, count: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              Guardar Registro
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
