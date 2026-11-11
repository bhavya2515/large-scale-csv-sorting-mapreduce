import React, { useState } from 'react';
import { BarChart3, Play, RefreshCw, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';
import { Dataset, BenchmarkExperiment } from '../types';
import { executeBaselineSort, executeMapReduceSort } from '../engine/mapReduceEngine';

interface PerformanceBenchmarkProps {
  dataset: Dataset;
  sortColumn: string;
}

export const PerformanceBenchmark: React.FC<PerformanceBenchmarkProps> = ({ dataset, sortColumn }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [experiments, setExperiments] = useState<BenchmarkExperiment[] | null>(null);

  const colMeta = dataset.columns.find((c) => c.name === sortColumn) || dataset.columns[0];

  const runBenchmark = async () => {
    setIsRunning(true);
    setExperiments(null);

    // Give UI a chance to refresh
    await new Promise((r) => setTimeout(r, 50));

    const results: BenchmarkExperiment[] = [];

    // 1. Single Thread Baseline
    const baseline = executeBaselineSort(dataset.data, colMeta.name, colMeta.type, true);
    results.push({
      name: 'Single-Thread Baseline',
      type: 'Single-Thread',
      chunks: 1,
      timeMs: baseline.latencyMs,
      throughputRowsSec: Math.round((dataset.rowCount / Math.max(0.001, baseline.latencyMs / 1000)))
    });

    // 2. MapReduce with 2, 4, 8, 16 Chunks
    const chunkConfigs = [2, 4, 8, 16];
    for (const k of chunkConfigs) {
      const mrRes = await executeMapReduceSort(
        dataset.data,
        colMeta.name,
        colMeta.type,
        k,
        true
      );
      results.push({
        name: `MapReduce (${k} Chunks)`,
        type: 'MapReduce',
        chunks: k,
        timeMs: mrRes.timings.totalMs,
        throughputRowsSec: Math.round((dataset.rowCount / Math.max(0.001, mrRes.timings.totalMs / 1000))),
        timings: mrRes.timings
      });
    }

    setExperiments(results);
    setIsRunning(false);
  };

  const maxTime = experiments ? Math.max(...experiments.map((e) => e.timeMs)) : 100;
  const maxThroughput = experiments ? Math.max(...experiments.map((e) => e.throughputRowsSec)) : 10000;

  return (
    <div className="space-y-6">
      {/* Benchmark Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">
              Multi-Core MapReduce Performance Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirically compares Single-Thread Standard sort against K-Way Min-Heap MapReduce across {dataset.rowCount.toLocaleString()} records
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Running Benchmark Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Execute Performance Test Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Charts & Table if Results Available */}
      {experiments && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Latency Comparison Chart */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Execution Latency (Lower is Better)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Total milliseconds to sort {dataset.rowCount.toLocaleString()} rows
                </span>
              </div>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>

            <div className="space-y-3.5 pt-2">
              {experiments.map((exp, idx) => {
                const widthPercent = Math.max(8, (exp.timeMs / maxTime) * 100);
                const isSingle = exp.type === 'Single-Thread';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={isSingle ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                        {exp.name}
                      </span>
                      <span className="font-bold text-slate-200">{exp.timeMs} ms</span>
                    </div>
                    <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className={`h-full rounded-md transition-all duration-500 flex items-center px-2 text-[10px] font-mono font-bold ${
                          isSingle
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950'
                            : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {exp.timeMs} ms
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Throughput Comparison Chart */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Processing Throughput (Higher is Better)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Rows processed per second
                </span>
              </div>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-3.5 pt-2">
              {experiments.map((exp, idx) => {
                const widthPercent = Math.max(8, (exp.throughputRowsSec / maxThroughput) * 100);
                const isSingle = exp.type === 'Single-Thread';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={isSingle ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                        {exp.name}
                      </span>
                      <span className="font-bold text-emerald-400">
                        {exp.throughputRowsSec.toLocaleString()} rows/s
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 transition-all duration-500 flex items-center px-2 text-[10px] font-mono font-bold"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {exp.throughputRowsSec.toLocaleString()}/s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Latency Breakdown Grid */}
          <div className="lg:col-span-12 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                MapReduce Stage Latency Breakdown (ms)
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Split</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Mapper</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Shuffle</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> K-Way Reducer</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3">Configuration</th>
                    <th className="py-2.5 px-3">Input Splitting</th>
                    <th className="py-2.5 px-3">Parallel Mappers</th>
                    <th className="py-2.5 px-3">Shuffle Partition</th>
                    <th className="py-2.5 px-3">K-Way Merge Reducer</th>
                    <th className="py-2.5 px-3 text-right">Total Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {experiments.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{exp.name}</td>
                      <td className="py-2.5 px-3 text-sky-400">{exp.timings?.splitMs ?? '—'} ms</td>
                      <td className="py-2.5 px-3 text-indigo-400">{exp.timings?.mapMs ?? '—'} ms</td>
                      <td className="py-2.5 px-3 text-amber-400">{exp.timings?.shuffleMs ?? '—'} ms</td>
                      <td className="py-2.5 px-3 text-emerald-400">{exp.timings?.reducerMs ?? exp.timeMs} ms</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">{exp.timeMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Big Data Insight Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Academic Architectural Takeaway: Internal vs External Memory Sorting
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <strong className="text-slate-200 block mb-1">1. Memory-Bounded Scalability ($O(K)$ RAM)</strong>
            While single-threaded TimSort is extremely fast for small datasets in RAM, it crashes with an Out-Of-Memory (OOM) error once the dataset exceeds RAM size. The MapReduce K-way external merge reducer requires only $O(K)$ memory, enabling multi-gigabyte or terabyte dataset sorting with deterministic memory boundaries.
          </div>
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <strong className="text-slate-200 block mb-1">2. Multi-Core Scaling & Partition Tradeoffs</strong>
            Increasing the partition count ($K$) decreases the per-mapper workload to $N/K$ rows, but increases heap comparison depth in the reducer ($\log_2 K$). The optimal number of chunks typically aligns with available physical CPU cores (e.g. 4 to 8 partitions).
          </div>
        </div>
      </div>
    </div>
  );
};
