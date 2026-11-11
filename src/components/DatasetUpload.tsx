import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Database, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Dataset } from '../types';
import { generateSalesDataset, generateSensorDataset, parseUploadedCSV, generate10RecordTestDataset } from '../data/sampleDatasets';

interface DatasetUploadProps {
  currentDataset: Dataset | null;
  onDatasetLoaded: (dataset: Dataset) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  currentDataset,
  onDatasetLoaded,
  isLoading,
  setIsLoading
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file format. Please upload a standard Comma-Separated Values (.csv) file.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const ds = parseUploadedCSV(file.name, text);
        onDatasetLoaded(ds);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to parse CSV file. Ensure valid headers and UTF-8 encoding.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading local file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = (type: 'sales' | 'sensor' | 'test10', count: number = 1000) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      try {
        let ds: Dataset;
        if (type === 'test10') {
          ds = generate10RecordTestDataset();
        } else if (type === 'sales') {
          ds = generateSalesDataset(count);
        } else {
          ds = generateSensorDataset(count);
        }
        onDatasetLoaded(ds);
      } finally {
        setIsLoading(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Custom CSV Dropzone */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Upload CSV Dataset
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Supports standard RFC 4180 CSV files with auto header detection
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              Max 500 MB
            </span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-400 bg-sky-950/20'
                : 'border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Drag & drop your CSV file here, or <span className="text-sky-400 underline font-semibold">browse computer</span>
            </p>
            <p className="text-xs text-slate-500 mt-1.5 font-mono">
              Preserves all original columns, types, and duplicate records
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Instant Academic Sample Datasets */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Pre-Loaded Benchmark Datasets
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant synthesis for laboratory testing & viva demonstration
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            {/* Featured 10-record test button */}
            <div className="mb-3">
              <button
                disabled={isLoading}
                onClick={() => loadSample('test10')}
                className="w-full p-2.5 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/60 hover:border-emerald-500 rounded-xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                      ★ 10 Records (Functional Test Dataset)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300">
                      BUILT-IN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pre-set for step-by-step tracing of Mappers, Min-Heap ties & K-Way Merge
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-900/40">
                  0.8 KB
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                disabled={isLoading}
                onClick={() => loadSample('sales', 1000)}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                    1,000 Records
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~95 KB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Retail Sales Records</p>
              </button>

              <button
                disabled={isLoading}
                onClick={() => loadSample('sensor', 5000)}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                    5,000 Records
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~460 KB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">IoT Telemetry Logs</p>
              </button>

              <button
                disabled={isLoading}
                onClick={() => loadSample('sales', 10000)}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                    10,000 Records
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~1.0 MB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Financial Transactions</p>
              </button>

              <button
                disabled={isLoading}
                onClick={() => loadSample('sales', 25000)}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300">
                    25,000 Records
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~2.4 MB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Multi-core Stress Test</p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Synthetic Generators (Uniform Seed)</span>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-sky-400">
                <RefreshCw className="w-3 h-3 animate-spin" /> Synthesizing...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      {currentDataset && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Dataset Identifier</span>
            <div className="text-sm font-bold text-slate-100 mt-1 truncate" title={currentDataset.name}>
              {currentDataset.name}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {currentDataset.isCustomUpload ? 'Custom Uploaded CSV' : 'Standard Benchmark'}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Total Rows</span>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1">
              {currentDataset.rowCount.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">Unfiltered records</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Attributes / Columns</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
              {currentDataset.columns.length}
            </div>
            <span className="text-[11px] text-slate-500">Schema verified</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Data Integrity</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mt-1">
              <CheckCircle2 className="w-4 h-4" /> Valid CSV
            </div>
            <span className="text-[11px] font-mono text-slate-500">{currentDataset.fileSizeFormatted}</span>
          </div>
        </div>
      )}
    </div>
  );
};
