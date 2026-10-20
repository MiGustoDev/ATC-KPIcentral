import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, AlertTriangle, ArrowUpDown, Download, 
  CheckCircle2, Clock, AlertOctagon, DollarSign, ShieldAlert, 
  Search
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fmtInt, fmtCurrency, fmtPct, getMetricStatus } from '../utils';
import { CHANNELS } from '../config';
import { AnimatedCounter } from './AnimatedCounter';

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

  const containerRef = useRef(null);

  // GSAP animation for filter bar and KPI cards
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        '.op-filter-bar',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 }
      ).fromTo(
        '.kpi-card',
        { opacity: 0, y: 14, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.035 },
        '-=0.2'
      );
    },
    { scope: containerRef, dependencies: [selectedPeriod, selectedCanal, selectedSup] }
  );

  // GSAP animation when switching tabs
  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.fromTo(
          '.op-view-content',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
        );
      }
    },
    { scope: containerRef, dependencies: [activeTab] }
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

  // Sorted records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredRecords, sortField, sortAsc]);

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

    filteredRecords.forEach((r) => {
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
  }, [filteredRecords, supervisors, storeMap]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    if (sortedRecords.length === 0) return;
    const headers = [
      'Canal', 'Tienda', 'Supervisor', 'Órdenes Confirmadas', 
      'Cancelaciones (cant)', 'Cancelaciones (%)', 'Reclamos (cant)', 
      'Reclamos (%)', 'Reclamos ($)', 'Demoras (cant)', 'Demoras (%)', 'Disponibilidad (%)'
    ];
    const rows = sortedRecords.map((r) => {
      const sup = supervisorMap[storeMap[r.tienda.toLowerCase()]]?.name || 'Sin Asignar';
      return [
        r.canal,
        `"${r.tienda}"`,
        `"${sup}"`,
        r.confirmadas,
        r.cancelaciones,
        r.cancelacionesPct,
        r.reclamos,
        r.reclamosPct,
        r.reclamosCosto,
        r.demoras,
        r.demorasPct,
        r.disponibilidad
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_KPI_${selectedPeriod.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  return (
    <div ref={containerRef} className="space-y-5 w-full">
      {/* Filters Bar */}
      <div className="op-filter-bar bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Período:
              </span>
              <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 transition-all cursor-pointer shadow-sm"
              >
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Canal Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Canal:
              </span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setSelectedCanal('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCanal === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedCanal(ch.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedCanal === ch.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supervisora Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Supervisora:
              </span>
              <select
                value={selectedSup}
                onChange={(e) => setSelectedSup(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="ALL">Todas las Supervisoras</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search & Export */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all w-48 sm:w-56"
              />
            </div>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with GSAP Stagger and Animated Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono-numbers">
        {/* Órdenes */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Órdenes Confirmadas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            <AnimatedCounter value={kpiSummary.totalOrders} decimals={0} />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Total en selección</div>
        </div>

        {/* Cancelaciones */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">% Cancelaciones</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            <AnimatedCounter value={kpiSummary.cancPct} decimals={1} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Objetivo: &le; 0.5%</div>
        </div>

        {/* Reclamos */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">% Reclamos</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            <AnimatedCounter value={kpiSummary.recPct} decimals={1} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Objetivo: &le; 1.5%</div>
        </div>

        {/* Costo Reclamos */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Costo Reclamos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            <AnimatedCounter value={kpiSummary.recCosto} decimals={0} prefix="$ " />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Impacto económico</div>
        </div>

        {/* Demoras */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">% Demoras</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            <AnimatedCounter value={kpiSummary.demPct} decimals={1} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Objetivo: &le; 5.0%</div>
        </div>

        {/* Disponibilidad */}
        <div className="kpi-card bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-default shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span className="font-semibold">Disponibilidad</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            <AnimatedCounter value={kpiSummary.dispAvg} decimals={1} suffix="%" />
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">Objetivo: &ge; 98.0%</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'table'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Detalle por Sucursal y Canal ({sortedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'grouped'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Consolidado por Supervisora ({supervisorGroups.length})
          </button>
        </div>

        {kpiSummary.criticCount > 0 && (
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{kpiSummary.criticCount} sucursales en estado de atención o crítico</span>
          </div>
        )}
      </div>

      {/* View Content */}
      {activeTab === 'table' ? (
        <div className="op-view-content bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950/95 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th onClick={() => handleSort('canal')} className="p-3.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Canal <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('tienda')} className="p-3.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Sucursal <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th className="p-3.5">Supervisora</th>
                  <th onClick={() => handleSort('confirmadas')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Órdenes <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('cancelacionesPct')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Canc. % <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('reclamosPct')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Recl. % <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('reclamosCosto')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Recl. $ <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('demorasPct')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Demoras % <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                  <th onClick={() => handleSort('disponibilidad')} className="p-3.5 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">Disp. % <ArrowUpDown className="w-3 h-3 text-slate-600" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                {sortedRecords.map((r, idx) => {
                  const supId = storeMap[r.tienda.toLowerCase()];
                  const sup = supervisorMap[supId];
                  const cancStatus = getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds);
                  const recStatus = getMetricStatus('reclamosPct', r.reclamosPct, thresholds);
                  const demStatus = getMetricStatus('demorasPct', r.demorasPct, thresholds);
                  const dispStatus = getMetricStatus('disponibilidad', r.disponibilidad, thresholds);

                  return (
                    <tr key={`${r.canal}-${r.tienda}-${idx}`} className="table-row-anim hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-sans">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor:
                              r.canal === 'PedidosYa'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : r.canal === 'Rappi'
                                ? 'rgba(249, 115, 22, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color:
                              r.canal === 'PedidosYa'
                                ? '#f87171'
                                : r.canal === 'Rappi'
                                ? '#fb923c'
                                : '#34d399',
                            borderColor:
                              r.canal === 'PedidosYa'
                                ? 'rgba(239, 68, 68, 0.25)'
                                : r.canal === 'Rappi'
                                ? 'rgba(249, 115, 22, 0.25)'
                                : 'rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          {r.canal}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans font-bold text-white">{r.tienda}</td>
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
                        {fmtInt(r.confirmadas)}
                      </td>

                      {/* Cancelaciones */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                            cancStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : cancStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {fmtPct(r.cancelacionesPct)}
                        </span>
                      </td>

                      {/* Reclamos */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                            recStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : recStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {fmtPct(r.reclamosPct)}
                        </span>
                      </td>

                      {/* Reclamos $ */}
                      <td className="p-3.5 text-right text-slate-300 font-semibold">
                        {fmtCurrency(r.reclamosCosto)}
                      </td>

                      {/* Demoras */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                            demStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : demStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {fmtPct(r.demorasPct)}
                        </span>
                      </td>

                      {/* Disponibilidad */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                            dispStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : dispStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
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
        </div>
      ) : (
        /* Consolidated Grouped View by Supervisor */
        <div className="op-view-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {supervisorGroups.map((g) => (
            <div key={g.supervisor.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl hover:-translate-y-1 hover:border-slate-700 transition-all duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">{g.supervisor.name}</h3>
                  <div className="text-xs text-slate-400">{g.records.length} tiendas operando</div>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md"
                  style={{ backgroundColor: `${g.supervisor.color}25`, color: g.supervisor.color }}
                >
                  {g.supervisor.name.substring(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Total Órdenes</div>
                  <div className="text-base font-black text-white mt-0.5">
                    {fmtInt(g.totalOrders)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Costo Reclamos</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {fmtCurrency(g.totalRecCosto)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Cancelaciones</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.cancPct)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Reclamos</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.recPct)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Demoras</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.demPct)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 font-sans text-[11px]">Disponibilidad</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {fmtPct(g.disponibilidadAvg)}
                  </div>
                </div>
              </div>

              {/* Top stores ranking */}
              <div className="pt-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Top Sucursales con Mayor Volumen
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {g.records
                    .sort((a, b) => (b.confirmadas || 0) - (a.confirmadas || 0))
                    .slice(0, 5)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/70"
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
