import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowUpDown, Download, Search, AlertTriangle,
  ShoppingBag, XCircle, MessageSquareWarning, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fmtInt, fmtCurrency, fmtPct, getMetricStatus, getInitials } from '../utils';
import { CHANNELS, CANAL_THEMES } from '../config';
import { AnimatedCounter } from './AnimatedCounter';
import { CustomSelect } from './CustomSelect';
import { exportOperationalKPItoPDF } from '../utils/pdfExport';

export function OperationalDashboard({
  periodData,
  selectedPeriod,
  onPeriodChange,
  availablePeriods,
  supervisors,
  stores,
  thresholds
}) {
  const [selectedCanal, setSelectedCanal] = useState('ALL');
  const [selectedSup, setSelectedSup] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('confirmadas');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'grouped'
  const [filterOnlyCritical, setFilterOnlyCritical] = useState(false);

  const containerRef = useRef(null);

  // Initial entrance animation for filter bar and KPI cards (runs once on mount)
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        '.op-filter-bar',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 }
      ).fromTo(
        '.kpi-card',
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.035 },
        '-=0.2'
      );
    },
    { scope: containerRef, dependencies: [] }
  );

  // Smooth, subtle transition when switching between subtabs
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const viewContent = containerRef.current.querySelector('.op-view-content');
      if (viewContent) {
        gsap.fromTo(
          viewContent,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform' }
        );
      }
      if (activeTab === 'grouped') {
        const groupCards = containerRef.current.querySelectorAll('.sup-group-card');
        if (groupCards.length > 0) {
          gsap.fromTo(
            groupCards,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'transform' }
          );
        }
      }
    },
    { scope: containerRef, dependencies: [activeTab] }
  );

  // Subtle transition when filtering channels, supervisors, period or critical records
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const viewContent = containerRef.current.querySelector('.op-view-content');
      if (viewContent) {
        gsap.fromTo(
          viewContent,
          { opacity: 0.45 },
          { opacity: 1, duration: 0.22, ease: 'power1.out' }
        );
      }
    },
    { scope: containerRef, dependencies: [selectedCanal, selectedSup, selectedPeriod, filterOnlyCritical] }
  );

  // Map stores to supervisor
  const storeMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => {
      map[s.name.toLowerCase()] = s.sup;
    });
    return map;
  }, [stores]);

  const supervisorMap = useMemo(() => {
    const map = {};
    supervisors.forEach((sup) => {
      map[sup.id] = sup;
    });
    return map;
  }, [supervisors]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!periodData || !periodData.records) return [];

    return periodData.records.filter((rec) => {
      if (selectedCanal !== 'ALL' && rec.canal !== selectedCanal) return false;

      const supId = storeMap[rec.tienda.toLowerCase()];
      if (selectedSup !== 'ALL' && supId !== selectedSup) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!rec.tienda.toLowerCase().includes(q) && !rec.canal.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [periodData, selectedCanal, selectedSup, searchTerm, storeMap]);

  // Helper to determine if a record has any critical metric
  const isCriticalRecord = (r) => {
    return (
      getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds) === 'danger' ||
      getMetricStatus('reclamosPct', r.reclamosPct, thresholds) === 'danger' ||
      getMetricStatus('demorasPct', r.demorasPct, thresholds) === 'danger' ||
      getMetricStatus('disponibilidad', r.disponibilidad, thresholds) === 'danger'
    );
  };

  // Sorted records (optionally filtered to only critical rows)
  const sortedRecords = useMemo(() => {
    const list = filterOnlyCritical
      ? filteredRecords.filter(isCriticalRecord)
      : filteredRecords;

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredRecords, filterOnlyCritical, sortField, sortAsc, thresholds]);

  // Aggregate global KPIs for filtered selection
  const kpiSummary = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalOrders: 0,
        cancPct: 0,
        recPct: 0,
        recCosto: 0,
        demPct: 0,
        dispAvg: 0,
        criticCount: 0
      };
    }

    const totalOrders = filteredRecords.reduce((acc, r) => acc + (r.confirmadas || 0), 0);
    const totalCanc = filteredRecords.reduce((acc, r) => acc + (r.cancelaciones || 0), 0);
    const totalRec = filteredRecords.reduce((acc, r) => acc + (r.reclamos || 0), 0);
    const totalRecCosto = filteredRecords.reduce((acc, r) => acc + (r.reclamosCosto || 0), 0);
    const totalDem = filteredRecords.reduce((acc, r) => acc + (r.demoras || 0), 0);
    const avgDisp = filteredRecords.reduce((acc, r) => acc + (r.disponibilidad || 0), 0) / filteredRecords.length;

    let criticCount = 0;
    filteredRecords.forEach((r) => {
      if (
        getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds) === 'danger' ||
        getMetricStatus('reclamosPct', r.reclamosPct, thresholds) === 'danger' ||
        getMetricStatus('demorasPct', r.demorasPct, thresholds) === 'danger' ||
        getMetricStatus('disponibilidad', r.disponibilidad, thresholds) === 'danger'
      ) {
        criticCount++;
      }
    });

    return {
      totalOrders,
      cancPct: totalOrders > 0 ? (totalCanc / totalOrders) * 100 : 0,
      recPct: totalOrders > 0 ? (totalRec / totalOrders) * 100 : 0,
      recCosto: totalRecCosto,
      demPct: totalOrders > 0 ? (totalDem / totalOrders) * 100 : 0,
      dispAvg: avgDisp,
      criticCount
    };
  }, [filteredRecords, thresholds]);

  // Grouped by Supervisor
  const supervisorGroups = useMemo(() => {
    const groups = {};
    supervisors.forEach((sup) => {
      groups[sup.id] = {
        supervisor: sup,
        records: [],
        totalOrders: 0,
        totalCanc: 0,
        totalRec: 0,
        totalRecCosto: 0,
        totalDem: 0,
        disponibilidadAvg: 0
      };
    });

    groups['unassigned'] = {
      supervisor: { id: 'unassigned', name: 'Sin Asignar', color: '#64748b' },
      records: [],
      totalOrders: 0,
      totalCanc: 0,
      totalRec: 0,
      totalRecCosto: 0,
      totalDem: 0,
      disponibilidadAvg: 0
    };

    const targetRecords = filterOnlyCritical
      ? filteredRecords.filter(isCriticalRecord)
      : filteredRecords;

    targetRecords.forEach((r) => {
      const supId = storeMap[r.tienda.toLowerCase()] || 'unassigned';
      if (!groups[supId]) {
        groups[supId] = {
          supervisor: { id: supId, name: supId, color: '#64748b' },
          records: [],
          totalOrders: 0,
          totalCanc: 0,
          totalRec: 0,
          totalRecCosto: 0,
          totalDem: 0,
          disponibilidadAvg: 0
        };
      }
      groups[supId].records.push(r);
      groups[supId].totalOrders += r.confirmadas || 0;
      groups[supId].totalCanc += r.cancelaciones || 0;
      groups[supId].totalRec += r.reclamos || 0;
      groups[supId].totalRecCosto += r.reclamosCosto || 0;
      groups[supId].totalDem += r.demoras || 0;
    });

    return Object.values(groups)
      .filter((g) => g.records.length > 0)
      .map((g) => {
        const orders = g.totalOrders;
        const dispAvg = g.records.reduce((acc, r) => acc + (r.disponibilidad || 0), 0) / g.records.length;
        return {
          ...g,
          cancPct: orders > 0 ? (g.totalCanc / orders) * 100 : 0,
          recPct: orders > 0 ? (g.totalRec / orders) * 100 : 0,
          demPct: orders > 0 ? (g.totalDem / orders) * 100 : 0,
          disponibilidadAvg: dispAvg
        };
      })
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [filteredRecords, filterOnlyCritical, supervisors, storeMap, thresholds]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (sortedRecords.length === 0) {
      alert('No hay registros para exportar con los filtros seleccionados.');
      return;
    }
    setIsExportingPDF(true);
    try {
      await exportOperationalKPItoPDF({
        records: sortedRecords,
        period: selectedPeriod,
        selectedCanal,
        selectedSup,
        supervisorMap,
        storeMap,
        kpiSummary,
        thresholds
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 w-full">
      {/* Modern Filter Toolbar */}
      <div className="op-filter-bar relative z-30 glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Período
              </span>
              <CustomSelect
                value={selectedPeriod}
                onChange={onPeriodChange}
                options={availablePeriods.map((p) => ({ value: p, label: p }))}
                placeholder="Seleccionar período"
                className="w-48 sm:w-56"
              />
            </div>

            {/* Canal Switcher - Modern Segmented Control */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Canal
              </span>
              <div className={`inline-flex rounded-xl bg-slate-950/80 p-1 border shadow-inner transition-colors duration-300 ${
                selectedCanal === 'PedidosYa' ? 'border-red-500/40' :
                selectedCanal === 'Rappi' ? 'border-orange-500/40' :
                selectedCanal === 'Mercado Delivery' ? 'border-amber-400/40' :
                'border-slate-800/80'
              }`}>
                <button
                  onClick={() => setSelectedCanal('ALL')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedCanal === 'ALL'
                      ? CANAL_THEMES.ALL.active
                      : CANAL_THEMES.ALL.inactive
                  }`}
                >
                  Todos
                </button>
                {CHANNELS.map((ch) => {
                  const theme = CANAL_THEMES[ch.id] || CANAL_THEMES.ALL;
                  const isSelected = selectedCanal === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedCanal(ch.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected ? theme.active : theme.inactive
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supervisora Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supervisora
              </span>
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

          {/* Search & Export Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 transition-all duration-200 w-48 sm:w-56 focus:outline-none shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 text-xs font-bold text-slate-200 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Exportar reporte de grilla en formato PDF"
            >
              {isExportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isExportingPDF ? 'Generando PDF...' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono-numbers">
        {/* Órdenes */}
        <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Órdenes Confirmadas</span>
            <ShoppingBag className="w-5 h-5 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={kpiSummary.totalOrders} decimals={0} />
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Total en selección
            </span>
          </div>
        </div>

        {/* Cancelaciones */}
        {(() => {
          const status = getMetricStatus('cancelacionesPct', kpiSummary.cancPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Cancelaciones</span>
                <XCircle className="w-5 h-5 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                <AnimatedCounter value={kpiSummary.cancPct} decimals={1} suffix="%" />
              </div>
              <div className="mt-2 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.cancelacionesPct?.ok || 0.5}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Reclamos */}
        {(() => {
          const status = getMetricStatus('reclamosPct', kpiSummary.recPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Reclamos</span>
                <MessageSquareWarning className="w-5 h-5 text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                <AnimatedCounter value={kpiSummary.recPct} decimals={1} suffix="%" />
              </div>
              <div className="mt-2 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.reclamosPct?.ok || 1.5}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Costo Reclamos */}
        <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Costo Reclamos</span>
            <DollarSign className="w-5 h-5 text-emerald-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            <AnimatedCounter value={kpiSummary.recCosto} decimals={0} prefix="$ " />
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Impacto económico
            </span>
          </div>
        </div>

        {/* Demoras */}
        {(() => {
          const status = getMetricStatus('demorasPct', kpiSummary.demPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Demoras</span>
                <Clock className="w-5 h-5 text-orange-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                <AnimatedCounter value={kpiSummary.demPct} decimals={1} suffix="%" />
              </div>
              <div className="mt-2 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.demorasPct?.ok || 5.0}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Disponibilidad */}
        {(() => {
          const status = getMetricStatus('disponibilidad', kpiSummary.dispAvg, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">Disponibilidad</span>
                <CheckCircle2 className="w-5 h-5 text-teal-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                <AnimatedCounter value={kpiSummary.dispAvg} decimals={1} suffix="%" />
              </div>
              <div className="mt-2 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &ge; {thresholds.disponibilidad?.ok || 98.0}%
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Subtabs Switcher & Critical Alert Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-slate-800 text-amber-300 border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
            }`}
          >
            Detalle por Sucursal y Canal ({sortedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'grouped'
                ? 'bg-slate-800 text-amber-300 border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
            }`}
          >
            Consolidado por Supervisora ({supervisorGroups.length})
          </button>
        </div>

        {kpiSummary.criticCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterOnlyCritical((prev) => !prev)}
            className={`inline-flex items-center gap-2.5 text-xs px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer select-none border backdrop-blur-md ${
              filterOnlyCritical
                ? 'bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-red-950/90 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/30'
                : 'bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-rose-950/40 text-rose-200 border-rose-500/35 hover:border-rose-400/60 hover:bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.18)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
            }`}
            title={filterOnlyCritical ? "Click para ver todos los registros" : "Click para filtrar sólo registros críticos"}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-rose-400/30" />
            </span>

            <div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-3 h-3 stroke-[2.3]" />
            </div>

            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/25 border border-rose-500/35 text-rose-100 font-mono-numbers font-bold text-[11px] leading-none shadow-inner">
              {kpiSummary.criticCount}
            </span>

            <span className="font-semibold tracking-tight text-slate-200">
              registros requieren atención o están críticos
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
              filterOnlyCritical
                ? 'bg-rose-500 text-white border-rose-300 flex items-center gap-1 shadow-sm'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/25 hover:bg-rose-500/25'
            }`}>
              {filterOnlyCritical ? (
                <>
                  <span>Filtrando</span>
                  <span className="text-xs leading-none font-bold">&times;</span>
                </>
              ) : (
                'Filtrar'
              )}
            </span>
          </button>
        )}
      </div>

      {/* View Content */}
      {activeTab === 'table' ? (
        <div className="op-view-content glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                <tr>
                  <th onClick={() => handleSort('canal')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors">
                    <div className="flex items-center gap-1.5">
                      Canal
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'canal' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('tienda')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors">
                    <div className="flex items-center gap-1.5">
                      Sucursal
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'tienda' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th className="p-3.5">Supervisora</th>
                  <th onClick={() => handleSort('confirmadas')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Órdenes
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'confirmadas' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('cancelacionesPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Canc. %
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'cancelacionesPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('reclamosPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Recl. %
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'reclamosPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('reclamosCosto')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Recl. $
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'reclamosCosto' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('demorasPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Demoras %
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'demorasPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('disponibilidad')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      Disp. %
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'disponibilidad' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
                {sortedRecords.map((r, idx) => {
                  const supId = storeMap[r.tienda.toLowerCase()];
                  const sup = supervisorMap[supId];
                  const cancStatus = getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds);
                  const recStatus = getMetricStatus('reclamosPct', r.reclamosPct, thresholds);
                  const demStatus = getMetricStatus('demorasPct', r.demorasPct, thresholds);
                  const dispStatus = getMetricStatus('disponibilidad', r.disponibilidad, thresholds);

                  return (
                    <tr
                      key={`${r.canal}-${r.tienda}-${idx}`}
                      className="table-row-anim hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* Canal Badge - Solid Pastel Themed */}
                      <td className="p-3.5 font-sans">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs tracking-wide shadow-sm ${
                            r.canal === 'PedidosYa'
                              ? 'bg-red-500 text-white font-bold border border-red-400/40 shadow-red-950/40'
                              : r.canal === 'Rappi'
                              ? 'bg-orange-500 text-white font-bold border border-orange-400/40 shadow-orange-950/40'
                              : 'bg-amber-500 text-white font-bold border border-amber-400/50 shadow-amber-950/40'
                          }`}
                        >
                          {r.canal}
                        </span>
                      </td>

                      {/* Sucursal Name */}
                      <td className="p-3.5 font-sans font-bold text-white text-sm">
                        {r.tienda}
                      </td>

                      {/* Supervisora Tag */}
                      <td className="p-3.5 font-sans">
                        {sup ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/70 text-slate-200 border border-slate-700/60 shadow-sm">
                            <span
                              className="w-2 h-2 rounded-full shadow-sm shrink-0"
                              style={{ backgroundColor: sup.color }}
                            />
                            {sup.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Sin asignar</span>
                        )}
                      </td>

                      {/* Órdenes */}
                      <td className="p-3.5 text-right font-black text-white text-sm">
                        {fmtInt(r.confirmadas)}
                      </td>

                      {/* Cancelaciones */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            cancStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : cancStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.cancelacionesPct)}
                        </span>
                      </td>

                      {/* Reclamos */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            recStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : recStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.reclamosPct)}
                        </span>
                      </td>

                      {/* Reclamos $ */}
                      <td className="p-3.5 text-right text-slate-200 font-semibold">
                        {fmtCurrency(r.reclamosCosto)}
                      </td>

                      {/* Demoras */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            demStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : demStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.demorasPct)}
                        </span>
                      </td>

                      {/* Disponibilidad */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            dispStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : dispStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.disponibilidad)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-medium">
              Mostrando <strong className="text-white font-mono-numbers">{sortedRecords.length}</strong> sucursales y canales
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">En Meta</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">Advertencia</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-300">Crítico</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Consolidated Grouped View by Supervisor */
        <div className="op-view-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {supervisorGroups.map((g) => (
            <div
              key={g.supervisor.id}
              className="sup-group-card glass-card rounded-2xl p-5 space-y-4 shadow-xl hover:-translate-y-1 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-md ring-1 ring-white/10"
                    style={{ backgroundColor: `${g.supervisor.color}25`, color: g.supervisor.color }}
                  >
                    {getInitials(g.supervisor.name)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{g.supervisor.name}</h3>
                    <div className="text-xs text-slate-400">{g.records.length} tiendas operando</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Total Órdenes</div>
                  <div className="text-base font-black text-white mt-0.5">
                    {fmtInt(g.totalOrders)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Costo Reclamos</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {fmtCurrency(g.totalRecCosto)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Cancelaciones</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.cancPct)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Reclamos</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.recPct)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Demoras</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.demPct)}
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Disponibilidad</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.disponibilidadAvg)}
                  </div>
                </div>
              </div>

              {/* Top stores ranking */}
              <div className="pt-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Top Sucursales con Mayor Volumen
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                  {g.records
                    .sort((a, b) => (b.confirmadas || 0) - (a.confirmadas || 0))
                    .slice(0, 5)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/70"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-slate-500 font-mono">#{i + 1}</span>
                          <span className="text-white font-medium truncate">{item.tienda}</span>
                        </div>
                        <span className="font-bold font-mono-numbers text-slate-300">
                          {fmtInt(item.confirmadas)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
