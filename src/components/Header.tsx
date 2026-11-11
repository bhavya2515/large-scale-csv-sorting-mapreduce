import { Layers, Activity, BarChart3, BookOpen, Code2, Cpu, ShieldCheck } from 'lucide-react';
import { Dataset } from '../types';

interface HeaderProps {
  activeTab: 'pipeline' | 'benchmark' | 'viva' | 'code';
  setActiveTab: (tab: 'pipeline' | 'benchmark' | 'viva' | 'code') => void;
  dataset: Dataset | null;
  onOpenTestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, dataset, onOpenTestModal }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Large-Scale CSV Sorting Using MapReduce
              </h1>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                Academic Edition
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Distributed Big Data Architecture • Chunking • K-Way Heap Reducer
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Test Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Sorting Pipeline
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Performance Lab
            </button>

            <button
              onClick={() => setActiveTab('viva')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'viva'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Hadoop & Viva Guide
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'code'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python & Windows 11 Center
            </button>
          </div>

          {/* Dedicated "Test Application" Button */}
          <button
            onClick={onOpenTestModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
            title="Run Automated Checks on 10-Record Dataset"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
            <span>Test Application</span>
          </button>
        </div>

        {/* Dataset Status Pill */}
        {dataset && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Active:</span>
            <span className="font-semibold text-slate-200">{dataset.rowCount.toLocaleString()} rows</span>
            <span className="text-slate-500 font-mono">({dataset.fileSizeFormatted})</span>
          </div>
        )}
      </div>
    </header>
  );
};
