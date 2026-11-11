import React from 'react';
import { Split, Cpu, GitFork, GitMerge, CheckCircle, Clock } from 'lucide-react';
import { MapReduceResult, Dataset } from '../types';

interface MapReducePipelineVisualizerProps {
  result: MapReduceResult | null;
  dataset: Dataset;
  isExecuting: boolean;
  progressPercent: number;
}

export const MapReducePipelineVisualizer: React.FC<MapReducePipelineVisualizerProps> = ({
  result,
  dataset,
  isExecuting,
  progressPercent
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <GitMerge className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-slate-100">
            MapReduce 4-Stage Execution Architecture
          </h3>
        </div>
        {result && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Globally Sorted
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-800/60 px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              {result.timings.totalMs} ms Total
            </span>
          </div>
        )}
      </div>

      {/* 4 Pipeline Stages DAG Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Stage 1: Input Splitter */}
        <div className={`p-4 rounded-xl border transition-all ${
          progressPercent >= 15 || result
            ? 'bg-slate-900 border-sky-500/50 shadow-lg shadow-sky-500/10'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
              <Split className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
              Stage 01
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-200">Input Splitting</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Partitions raw CSV into {result ? result.numChunks : 4} uniform chunks, preserving headers.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex justify-between text-slate-400">
            <span>Latency:</span>
            <span className="text-sky-300 font-bold">
              {result ? `${result.timings.splitMs} ms` : (isExecuting && progressPercent >= 15 ? 'Active' : '—')}
            </span>
          </div>
        </div>

        {/* Stage 2: Parallel Mappers */}
        <div className={`p-4 rounded-xl border transition-all ${
          progressPercent >= 40 || result
            ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
              Stage 02
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-200">Parallel Mappers</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Worker processes parse target keys and sort each chunk partition in parallel.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex justify-between text-slate-400">
            <span>Latency:</span>
            <span className="text-indigo-300 font-bold">
              {result ? `${result.timings.mapMs} ms` : (isExecuting && progressPercent >= 40 ? 'Active' : '—')}
            </span>
          </div>
        </div>

        {/* Stage 3: Shuffle and Sort */}
        <div className={`p-4 rounded-xl border transition-all ${
          progressPercent >= 70 || result
            ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <GitFork className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
              Stage 03
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-200">Shuffle & Partition</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Coordinates partition stream descriptors, key boundaries, and memory pointers.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex justify-between text-slate-400">
            <span>Latency:</span>
            <span className="text-amber-300 font-bold">
              {result ? `${result.timings.shuffleMs} ms` : (isExecuting && progressPercent >= 70 ? 'Active' : '—')}
            </span>
          </div>
        </div>

        {/* Stage 4: K-Way Reducer Merge */}
        <div className={`p-4 rounded-xl border transition-all ${
          progressPercent >= 90 || result
            ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <GitMerge className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
              Stage 04
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-200">K-Way Min-Heap Reducer</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Priority Queue merges streams with \(O(N \log K)\) time and \(O(K)\) RAM.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex justify-between text-slate-400">
            <span>Latency:</span>
            <span className="text-emerald-300 font-bold">
              {result ? `${result.timings.reducerMs} ms` : (isExecuting && progressPercent >= 90 ? 'Active' : '—')}
            </span>
          </div>
        </div>
      </div>

      {/* Mapper Partitions Breakdown if result available */}
      {result && result.chunkDetails.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Mapper Worker Partition Diagnostics
            </h4>
            <span className="text-[11px] text-slate-500">
              Sorted by: <span className="font-semibold text-slate-300">{result.sortColumn}</span> ({result.ascending ? 'Ascending' : 'Descending'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.chunkDetails.map((chunk) => (
              <div
                key={chunk.chunkId}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-sky-400 font-mono">
                      Mapper #{chunk.chunkId}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      SORTED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Rows:</span>
                    <span className="font-mono text-slate-200 font-semibold">{chunk.rowCount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-900 text-[10px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Min Key:</span>
                    <span className="text-slate-300 truncate max-w-[100px]">{String(chunk.minKey)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Max Key:</span>
                    <span className="text-slate-300 truncate max-w-[100px]">{String(chunk.maxKey)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Duration:</span>
                    <span className="text-sky-300 font-semibold">{chunk.executionTimeMs} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
