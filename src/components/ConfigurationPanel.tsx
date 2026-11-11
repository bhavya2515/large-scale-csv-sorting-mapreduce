import React from 'react';
import { Sliders, ArrowDownAZ, ArrowUpZA, Split, Play, RefreshCw, Cpu, Layers } from 'lucide-react';
import { Dataset, ColumnType } from '../types';

interface ConfigurationPanelProps {
  dataset: Dataset;
  sortColumn: string;
  setSortColumn: (col: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  numChunks: number;
  setNumChunks: (chunks: number) => void;
  algorithm: 'mapreduce' | 'baseline';
  setAlgorithm: (algo: 'mapreduce' | 'baseline') => void;
  onExecute: () => void;
  isExecuting: boolean;
  progressStep: string;
  progressPercent: number;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  dataset,
  sortColumn,
  setSortColumn,
  sortOrder,
  setSortOrder,
  numChunks,
  setNumChunks,
  algorithm,
  setAlgorithm,
  onExecute,
  isExecuting,
  progressStep,
  progressPercent
}) => {
  const selectedColMeta = dataset.columns.find(c => c.name === sortColumn);

  const getTypeBadge = (type: ColumnType) => {
    switch (type) {
      case 'numeric':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">NUM</span>;
      case 'datetime':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">DATE</span>;
      default:
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">TEXT</span>;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-slate-100">MapReduce Sorting Configuration</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Stage Parameters & Tuning
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Sort Column Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Sorting Key Column
          </label>
          <div className="relative">
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 appearance-none cursor-pointer"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type.toUpperCase()})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-2.5 pointer-events-none">
              {selectedColMeta && getTypeBadge(selectedColMeta.type)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Key parsed & typed by Mappers
          </p>
        </div>

        {/* Direction Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Sorting Direction
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => setSortOrder('asc')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                sortOrder === 'asc'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              Ascending
            </button>
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => setSortOrder('desc')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                sortOrder === 'desc'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
              Descending
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Configures Min-Heap vs Max-Heap
          </p>
        </div>

        {/* Number of Chunks K */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Partitions / Chunks ($K$)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 4, 8, 16].map((chunks) => (
              <button
                key={chunks}
                type="button"
                disabled={isExecuting}
                onClick={() => setNumChunks(chunks)}
                className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                  numChunks === chunks
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                {chunks}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Parallel Mappers spawned: {numChunks}
          </p>
        </div>

        {/* Algorithm Model */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Execution Algorithm
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => setAlgorithm('mapreduce')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                algorithm === 'mapreduce'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              MapReduce
            </button>
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => setAlgorithm('baseline')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                algorithm === 'baseline'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="w-3 h-3 text-amber-400" />
              Single-Core
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {algorithm === 'mapreduce' ? 'O(N log K) K-Way Merge' : 'O(N log N) Standard Sort'}
          </p>
        </div>
      </div>

      {/* Action Execution Button */}
      <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Split className="w-4 h-4 text-sky-400" />
          <span>
            Input will be split into <strong>{numChunks} chunks</strong> of approximately{' '}
            <strong className="text-slate-200">
              {Math.ceil(dataset.rowCount / numChunks).toLocaleString()} rows
            </strong>{' '}
            each.
          </span>
        </div>

        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer active:scale-95"
        >
          {isExecuting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Processing: {progressStep} ({progressPercent}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Run MapReduce Sorting Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Animated Progress Bar during execution */}
      {isExecuting && (
        <div className="mt-4">
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-1.5">
            <span>Stage: {progressStep}</span>
            <span>{progressPercent}% Complete</span>
          </div>
        </div>
      )}
    </div>
  );
};
