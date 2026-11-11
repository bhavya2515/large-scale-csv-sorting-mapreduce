import React, { useState } from 'react';
import { BookOpen, HelpCircle, HardDrive, Calculator, ChevronDown, ChevronUp, Layers, CheckCircle } from 'lucide-react';
import { VIVA_QUESTIONS } from '../data/vivaData';

export const HadoopVivaLab: React.FC = () => {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>('viva-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // HDFS Split Calculator State
  const [fileSizeMB, setFileSizeMB] = useState<number>(512);
  const [blockSizeMB, setBlockSizeMB] = useState<number>(128);

  // Partitioner Visualizer State
  const [partitionerType, setPartitionerType] = useState<'hash' | 'totalOrder'>('hash');

  const numSplits = Math.ceil(fileSizeMB / blockSizeMB);

  const categories = ['ALL', 'MapReduce Internals', 'Sorting Algorithms', 'Hadoop vs Simulation', 'Optimization & Performance'];

  const filteredQuestions = selectedCategory === 'ALL'
    ? VIVA_QUESTIONS
    : VIVA_QUESTIONS.filter((q) => q.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">
              Hadoop Architecture & Academic Viva Voce Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Essential distributed systems concepts, partitioner mechanics, and high-scoring viva exam prep
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 self-start md:self-auto">
          College Project Assessment Guide
        </span>
      </div>

      {/* Interactive Architecture Demonstrator: TotalOrderPartitioner vs HashPartitioner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Interactive Partitioner Visualizer: Why Multiple Reducers Need TotalOrderPartitioner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare standard Hadoop HashPartitioner vs TotalOrderPartitioner for global ordering
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPartitionerType('hash')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                partitionerType === 'hash'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Default HashPartitioner
            </button>
            <button
              onClick={() => setPartitionerType('totalOrder')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                partitionerType === 'totalOrder'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TotalOrderPartitioner
            </button>
          </div>
        </div>

        {partitionerType === 'hash' ? (
          <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
              <span>⚠ Standard Hadoop HashPartitioner (hash(key) % num_reducers)</span>
            </div>
            <p className="text-xs text-slate-300">
              Keys are scattered across reducers based on hash modulo. While each reducer output is locally sorted, the global output is <strong className="text-amber-300">NOT globally sorted</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">part-00000 (Reducer 0)</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-amber-400">Key: 12</div>
                  <div className="text-amber-400">Key: 440</div>
                  <div className="text-amber-400">Key: 998</div>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Locally sorted only</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">part-00001 (Reducer 1)</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-amber-400">Key: 4</div>
                  <div className="text-amber-400">Key: 512</div>
                  <div className="text-amber-400">Key: 780</div>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Locally sorted only</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">part-00002 (Reducer 2)</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-amber-400">Key: 19</div>
                  <div className="text-amber-400">Key: 300</div>
                  <div className="text-amber-400">Key: 890</div>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Locally sorted only</span>
              </div>
            </div>
            <div className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60 font-medium">
              ❌ Concatenating part-00000 + part-00001 + part-00002 results in: [12, 440, 998, 4, 512, 780, 19, 300, 890] — NOT globally sorted!
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 font-mono">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>TotalOrderPartitioner with InputSampler Range Cutoffs</span>
            </div>
            <p className="text-xs text-slate-300">
              InputSampler defines contiguous key boundaries. Reducers receive exclusive partitions, guaranteeing a <strong className="text-emerald-300">strict global sort</strong> when files are concatenated:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-800/60">
                <span className="text-emerald-400 text-[11px] block mb-1 font-bold">part-00000 [Range 0–300]</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-emerald-300">Key: 4</div>
                  <div className="text-emerald-300">Key: 12</div>
                  <div className="text-emerald-300">Key: 19</div>
                  <div className="text-emerald-300">Key: 300</div>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-800/60">
                <span className="text-emerald-400 text-[11px] block mb-1 font-bold">part-00001 [Range 301–700]</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-emerald-300">Key: 440</div>
                  <div className="text-emerald-300">Key: 512</div>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-800/60">
                <span className="text-emerald-400 text-[11px] block mb-1 font-bold">part-00002 [Range 701–1000]</span>
                <div className="space-y-1 text-slate-200">
                  <div className="text-emerald-300">Key: 780</div>
                  <div className="text-emerald-300">Key: 890</div>
                  <div className="text-emerald-300">Key: 998</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/60 font-medium">
              ✓ Concatenating part-00000 + part-00001 + part-00002 produces: [4, 12, 19, 300, 440, 512, 780, 890, 998] — 100% Strictly Globally Sorted!
            </div>
          </div>
        )}
      </div>

      {/* HDFS Split Calculator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
          <Calculator className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-slate-200">
            HDFS InputSplit & Mapper Allocation Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              CSV Dataset Size (MB)
            </label>
            <input
              type="number"
              min="10"
              max="102400"
              value={fileSizeMB}
              onChange={(e) => setFileSizeMB(Number(e.target.value) || 128)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              HDFS Block Size
            </label>
            <select
              value={blockSizeMB}
              onChange={(e) => setBlockSizeMB(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
            >
              <option value={64}>64 MB (Hadoop 1.x default)</option>
              <option value={128}>128 MB (Hadoop 2.x/3.x default)</option>
              <option value={256}>256 MB (High throughput large block)</option>
            </select>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 font-mono">Calculated Mappers Spawned:</span>
            <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
              {numSplits} Parallel InputSplits (Mappers)
            </div>
            <span className="text-[10px] text-slate-500">Formula: ceil(FileSize / BlockSize)</span>
          </div>
        </div>
      </div>

      {/* College Viva Questions Accordion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Frequently Asked College Viva Voce Questions & Answers
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any question to view the comprehensive academic explanation and key scoring points
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isOpen = openQuestionId === q.id;
            return (
              <div
                key={q.id}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 transition-all"
              >
                <button
                  onClick={() => setOpenQuestionId(isOpen ? null : q.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800/80 shrink-0">
                      {q.id.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {q.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 text-xs bg-slate-900/30">
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {q.answer}
                    </p>

                    {q.complexityFormula && (
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-sky-300 text-[11px]">
                        Complexity: {q.complexityFormula}
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Key Points for Examiners:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                        {q.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
