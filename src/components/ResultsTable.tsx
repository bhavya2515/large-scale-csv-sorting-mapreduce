import React, { useState } from 'react';
import { Download, Search, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Dataset, MapReduceResult, DatasetRow } from '../types';

interface ResultsTableProps {
  result: MapReduceResult | null;
  dataset: Dataset;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, dataset }) => {
  const [activeTab, setActiveTab] = useState<'sorted' | 'original'>('sorted');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const currentData: DatasetRow[] = (activeTab === 'sorted' && result)
    ? result.sortedData
    : dataset.data;

  // Search filter
  const filteredData = currentData.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedRows = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadCSV = () => {
    const dataToExport = result ? result.sortedData : dataset.data;
    if (dataToExport.length === 0) return;

    const headers = dataset.columns.map((c) => c.name);
    const csvRows = [headers.join(',')];

    for (const row of dataToExport) {
      const line = headers.map((h) => {
        const val = row[h] !== undefined ? String(row[h]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(line.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sorted_${dataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* Toggle between Sorted vs Original */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('sorted');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'sorted'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sorted Output {result && `(${result.sortedData.length.toLocaleString()})`}
            </button>
            <button
              onClick={() => {
                setActiveTab('original');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'original'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original Raw Data
            </button>
          </div>

          {result && (
            <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              Integrity Verified
            </span>
          )}
        </div>

        {/* Search & Download Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono">
              <th className="py-2.5 px-3 w-12 text-center text-slate-500">#</th>
              {dataset.columns.map((col) => {
                const isSortCol = result && col.name === result.sortColumn;
                return (
                  <th
                    key={col.name}
                    className={`py-2.5 px-3 font-semibold ${
                      isSortCol
                        ? 'text-sky-400 bg-sky-950/30 border-b-2 border-sky-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      {isSortCol && (
                        <span className="text-[10px] bg-sky-900/80 text-sky-300 px-1 rounded">
                          {result.ascending ? '▲' : '▼'} KEY
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => {
                const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500">{globalIdx}</td>
                    {dataset.columns.map((col) => {
                      const isSortCol = result && col.name === result.sortColumn;
                      return (
                        <td
                          key={col.name}
                          className={`py-2 px-3 truncate max-w-[200px] ${
                            isSortCol ? 'text-sky-300 font-bold bg-sky-950/10' : 'text-slate-300'
                          }`}
                        >
                          {String(row[col.name] ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={dataset.columns.length + 1} className="py-8 text-center text-slate-500">
                  No records matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
        <div>
          Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
          {Math.min(currentPage * rowsPerPage, filteredData.length)} of{' '}
          {filteredData.length.toLocaleString()} rows
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:border-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:border-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
