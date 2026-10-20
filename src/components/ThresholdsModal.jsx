import React, { useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { INITIAL_THRESHOLDS } from '../config';
import { ModalWrapper } from './ModalWrapper';

export function ThresholdsModal({ isOpen, onClose, thresholds, onSaveThresholds }) {
  const [current, setCurrent] = useState({ ...thresholds });

  const handleChange = (key, field, val) => {
    setCurrent({
      ...current,
      [key]: {
        ...current[key],
        [field]: parseFloat(val) || 0
      }
    });
  };

  const handleReset = () => {
    setCurrent({ ...INITIAL_THRESHOLDS });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveThresholds(current);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg w-full p-6 space-y-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
    >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-slate-100">Configuración de Semáforos y Parámetros</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
            &times;
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Define los límites para clasificar el estado de cada sucursal en <span className="text-emerald-400 font-semibold">OK</span>, <span className="text-amber-400 font-semibold">Atención</span> o <span className="text-rose-400 font-semibold">Crítico</span>.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Cancelaciones % */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200">Cancelaciones (%)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Máximo para OK (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={current.cancelacionesPct.ok}
                  onChange={(e) => handleChange('cancelacionesPct', 'ok', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Máximo para Atención (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={current.cancelacionesPct.warning}
                  onChange={(e) => handleChange('cancelacionesPct', 'warning', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Reclamos % */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200">Reclamos (%)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Máximo para OK (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={current.reclamosPct.ok}
                  onChange={(e) => handleChange('reclamosPct', 'ok', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Máximo para Atención (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={current.reclamosPct.warning}
                  onChange={(e) => handleChange('reclamosPct', 'warning', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Demoras % */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200">Demoras (%)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Máximo para OK (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={current.demorasPct.ok}
                  onChange={(e) => handleChange('demorasPct', 'ok', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Máximo para Atención (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={current.demorasPct.warning}
                  onChange={(e) => handleChange('demorasPct', 'warning', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Disponibilidad % */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200">Disponibilidad de Tienda (%)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mínimo para OK (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={current.disponibilidad.ok}
                  onChange={(e) => handleChange('disponibilidad', 'ok', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Mínimo para Atención (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={current.disponibilidad.warning}
                  onChange={(e) => handleChange('disponibilidad', 'warning', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Valores
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                Guardar Parámetros
              </button>
            </div>
          </div>
        </form>
    </ModalWrapper>
  );
}
