import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DatasetUpload } from './components/DatasetUpload';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MapReducePipelineVisualizer } from './components/MapReducePipelineVisualizer';
import { ResultsTable } from './components/ResultsTable';
import { PerformanceBenchmark } from './components/PerformanceBenchmark';
import { HadoopVivaLab } from './components/HadoopVivaLab';
import { PythonCodeCenter } from './components/PythonCodeCenter';
import { TestApplicationModal } from './components/TestApplicationModal';
import { Dataset, MapReduceResult } from './types';
import { generateSalesDataset } from './data/sampleDatasets';
import { executeMapReduceSort } from './engine/mapReduceEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'benchmark' | 'viva' | 'code'>('pipeline');
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('sales_amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [numChunks, setNumChunks] = useState<number>(4);
  const [algorithm, setAlgorithm] = useState<'mapreduce' | 'baseline'>('mapreduce');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('Idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [result, setResult] = useState<MapReduceResult | null>(null);

  // Load initial default academic sample dataset on mount
  useEffect(() => {
    const initialDs = generateSalesDataset(1000);
    setDataset(initialDs);
    if (initialDs.columns.some((c) => c.name === 'sales_amount')) {
      setSortColumn('sales_amount');
    } else {
      setSortColumn(initialDs.columns[0]?.name || '');
    }
  }, []);

  // When dataset changes, ensure sortColumn is valid
  const handleDatasetLoaded = (newDs: Dataset) => {
    setDataset(newDs);
    setResult(null);
    if (newDs.columns.length > 0) {
      // Pick numeric column if available, else first column
      const numCol = newDs.columns.find((c) => c.type === 'numeric');
      setSortColumn(numCol ? numCol.name : newDs.columns[0].name);
    }
  };

  // Run MapReduce Sorting Pipeline
  const handleExecuteSort = async () => {
    if (!dataset || isExecuting) return;

    setIsExecuting(true);
    setProgressPercent(10);
    setProgressStep('Initializing Input Partitions');

    const colMeta = dataset.columns.find((c) => c.name === sortColumn) || dataset.columns[0];

    try {
      const res = await executeMapReduceSort(
        dataset.data,
        colMeta.name,
        colMeta.type,
        numChunks,
        sortOrder === 'asc',
        (step, pct) => {
          setProgressStep(step);
          setProgressPercent(pct);
        }
      );
      setResult(res);
    } catch (err: any) {
      console.error('Sorting execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Academic Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {activeTab === 'pipeline' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Module 1 & 2: Dataset Upload & Overview */}
            <DatasetUpload
              currentDataset={dataset}
              onDatasetLoaded={handleDatasetLoaded}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* Module 3: Configuration Panel */}
            {dataset && (
              <ConfigurationPanel
                dataset={dataset}
                sortColumn={sortColumn}
                setSortColumn={setSortColumn}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                numChunks={numChunks}
                setNumChunks={setNumChunks}
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                onExecute={handleExecuteSort}
                isExecuting={isExecuting}
                progressStep={progressStep}
                progressPercent={progressPercent}
              />
            )}

            {/* Module 4: MapReduce Execution Pipeline Visualizer */}
            {dataset && (
              <MapReducePipelineVisualizer
                result={result}
                dataset={dataset}
                isExecuting={isExecuting}
                progressPercent={progressPercent}
              />
            )}

            {/* Module 5: Results Inspection & CSV Download */}
            {dataset && (
              <ResultsTable
                result={result}
                dataset={dataset}
              />
            )}
          </div>
        )}

        {/* Module 6: Performance Benchmark Lab */}
        {activeTab === 'benchmark' && dataset && (
          <div className="animate-fadeIn">
            <PerformanceBenchmark
              dataset={dataset}
              sortColumn={sortColumn}
            />
          </div>
        )}

        {/* Academic Viva Voce & Hadoop Architecture Lab */}
        {activeTab === 'viva' && (
          <div className="animate-fadeIn">
            <HadoopVivaLab />
          </div>
        )}

        {/* Python Source Code & Windows 11 VS Code Center */}
        {activeTab === 'code' && (
          <div className="animate-fadeIn">
            <PythonCodeCenter />
          </div>
        )}
      </main>

      {/* Automated Testing Modal */}
      <TestApplicationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onLoadTestDataset={handleDatasetLoaded}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 font-mono">
          <div>
            <strong>Large-Scale CSV Sorting Using MapReduce</strong> • Computer Science & Engineering Academic Project
          </div>
          <div className="flex items-center gap-4">
            <span>Python 3.10+ / Flask / Pandas / Multiprocessing</span>
            <span className="text-slate-700">|</span>
            <span>Hadoop Streaming Compatible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
