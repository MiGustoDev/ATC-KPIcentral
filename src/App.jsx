import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ReviewsDashboard } from './components/ReviewsDashboard';
import { ImportModal } from './components/ImportModal';
import { ThresholdsModal } from './components/ThresholdsModal';
import { INITIAL_SUPERVISORS, INITIAL_STORES, INITIAL_THRESHOLDS } from './config';
import preloadedData from './preloadedData.json';

const LS_DATA_KEY = 'mg_kpi_central_data_v3';
const LS_THRESHOLDS_KEY = 'mg_kpi_thresholds_v3';



export default function App() {
  const [activeModule, setActiveModule] = useState('operational'); // 'operational' | 'reviews'

  // Datasets loaded from preloaded JSON or LocalStorage
  const [datasets, setDatasets] = useState(() => {
    const saved = localStorage.getItem(LS_DATA_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      } catch (e) {}
    }
    return preloadedData;
  });

  // Selected period for operational module
  const availablePeriods = Object.keys(datasets);
  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[availablePeriods.length - 1] || '5 al 12 de octubre'
  );

  // Semaphore thresholds
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem(LS_THRESHOLDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_THRESHOLDS;
  });

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);

  // Update selectedPeriod if availablePeriods change
  useEffect(() => {
    if (!datasets[selectedPeriod] && availablePeriods.length > 0) {
      setSelectedPeriod(availablePeriods[availablePeriods.length - 1]);
    }
  }, [datasets, selectedPeriod, availablePeriods]);

  const handleImportSuccess = (newParsedData) => {
    const merged = { ...datasets, ...newParsedData };
    setDatasets(merged);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(merged));
    
    // Select the first new sheet
    const newKeys = Object.keys(newParsedData);
    if (newKeys.length > 0) {
      setSelectedPeriod(newKeys[newKeys.length - 1]);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleSaveThresholds = (newThresholds) => {
    setThresholds(newThresholds);
    localStorage.setItem(LS_THRESHOLDS_KEY, JSON.stringify(newThresholds));
  };

  return (
    <div className="min-h-screen pb-16">
      <Header
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenThresholds={() => setIsThresholdsOpen(true)}
        periodCount={availablePeriods.length}
      />

      <main className="w-full px-4 sm:px-8 py-2">
        {activeModule === 'operational' ? (

          <OperationalDashboard
            periodData={datasets[selectedPeriod]}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            availablePeriods={availablePeriods}
            supervisors={INITIAL_SUPERVISORS}
            stores={INITIAL_STORES}
            thresholds={thresholds}
          />
        ) : (
          <ReviewsDashboard
            supervisors={INITIAL_SUPERVISORS}
            stores={INITIAL_STORES}
          />
        )}
      </main>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ThresholdsModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
      />
    </div>
  );
}
