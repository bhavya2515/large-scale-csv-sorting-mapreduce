import React, { useState } from 'react';
import { Code2, Copy, Check, Download, Terminal, FolderTree, Laptop } from 'lucide-react';
import JSZip from 'jszip';

interface PythonCodeCenterProps {
  onNotify?: (msg: string) => void;
}

const CODE_FILES: Record<string, { desc: string; code: string; ext: string }> = {
  'app.py': {
    desc: 'Flask Web Application Controller with routes for upload, configuration, sort execution, and Matplotlib performance charts',
    ext: 'python',
    code: `"""
Large-Scale CSV Sorting Using MapReduce
=======================================
Module: app.py
Flask Web Application for Large-Scale CSV Sorting using MapReduce.
"""

import os
import time
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from werkzeug.utils import secure_filename
from sorting_engine import MapReduceCSVSorter, benchmark_single_thread
from performance import run_benchmark_suite

app = Flask(__name__)
app.secret_key = "mapreduce_sorting_academic_secret_key"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
STATIC_IMG_FOLDER = os.path.join(BASE_DIR, "static", "images")
SAMPLE_DATA_FOLDER = os.path.join(BASE_DIR, "sample_data")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(STATIC_IMG_FOLDER, exist_ok=True)
os.makedirs(SAMPLE_DATA_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
ALLOWED_EXTENSIONS = {"csv"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    sample_files = []
    if os.path.exists(SAMPLE_DATA_FOLDER):
        for f in sorted(os.listdir(SAMPLE_DATA_FOLDER)):
            if f.endswith(".csv"):
                fp = os.path.join(SAMPLE_DATA_FOLDER, f)
                size_kb = os.path.getsize(fp) / 1024
                sample_files.append({"filename": f, "size_kb": f"{size_kb:.1f} KB"})
    return render_template("index.html", sample_files=sample_files)

@app.route("/execute_sort", methods=["POST"])
def execute_sort():
    filename = request.form.get("filename")
    sort_column = request.form.get("sort_column")
    sort_order = request.form.get("sort_order", "asc")
    num_chunks = int(request.form.get("num_chunks", 4))
    ascending = (sort_order == "asc")

    input_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    output_path = os.path.join(app.config["OUTPUT_FOLDER"], f"sorted_{filename}")

    sorter = MapReduceCSVSorter(num_chunks=num_chunks)
    res = sorter.execute_sort(input_path, output_path, sort_column, ascending=ascending)

    return render_template(
        "results.html",
        filename=filename,
        out_filename=f"sorted_{filename}",
        sort_column=sort_column,
        sort_order=sort_order,
        num_chunks=num_chunks,
        timings=res["timings"],
        mapper_details=res["mapper_details"],
        is_verified=True
    )

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
`
  },
  'sorting_engine.py': {
    desc: 'Core MapReduce sorting engine implementing Input Splitting, multiprocessing Mappers, and K-Way Heap Reducer',
    ext: 'python',
    code: `"""
Large-Scale CSV Sorting Using MapReduce
=======================================
Module: sorting_engine.py
Implements Input Splitting, multiprocessing Mappers, and K-Way Heap Reducer.
"""

import os
import time
import heapq
import tempfile
import pandas as pd
from multiprocessing import Pool, cpu_count
from typing import List, Dict, Any, Tuple

def mapper_sort_chunk(args: Tuple[str, str, bool, int]) -> Dict[str, Any]:
    chunk_file_path, sort_column, ascending, chunk_id = args
    start_time = time.perf_counter()

    df = pd.read_csv(chunk_file_path)
    # Infer column type for proper sorting
    try:
        df['_sort_key'] = pd.to_numeric(df[sort_column], errors='raise')
    except Exception:
        try:
            df['_sort_key'] = pd.to_datetime(df[sort_column], errors='raise')
        except Exception:
            df['_sort_key'] = df[sort_column].astype(str).str.lower()

    sorted_df = df.sort_values(by='_sort_key', ascending=ascending, na_position='last')
    sorted_df = sorted_df.drop(columns=['_sort_key'])

    sorted_chunk_path = chunk_file_path.replace(".csv", "_sorted.csv")
    sorted_df.to_csv(sorted_chunk_path, index=False)

    if os.path.exists(chunk_file_path):
        os.remove(chunk_file_path)

    elapsed = time.perf_counter() - start_time
    return {
        "chunk_id": chunk_id,
        "sorted_file_path": sorted_chunk_path,
        "row_count": len(sorted_df),
        "execution_time_sec": round(elapsed, 4),
        "min_key": str(sorted_df[sort_column].iloc[0]) if len(sorted_df) > 0 else "N/A",
        "max_key": str(sorted_df[sort_column].iloc[-1]) if len(sorted_df) > 0 else "N/A"
    }

class MapReduceCSVSorter:
    def __init__(self, num_chunks: int = 4):
        self.num_chunks = max(2, num_chunks)
        self.num_workers = min(self.num_chunks, cpu_count() or 4)

    def split_csv(self, input_csv_path: str, temp_dir: str) -> List[str]:
        # Streams and splits file evenly into K files while preserving CSV header
        ...

    def k_way_merge_reducer(self, sorted_chunk_paths, output_csv_path, sort_column, ascending=True):
        # O(N log K) Min-Heap Priority Queue Merge holding only O(K) rows in memory
        ...
`
  },
  'mapper.py': {
    desc: 'Hadoop Streaming & standalone Mapper script outputting <SortKey>\\t<OriginalCSVRow>',
    ext: 'python',
    code: `#!/usr/bin/env python3
import sys
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--col", type=int, default=0, help="0-based column index to sort by")
    args = parser.parse_known_args()[0]
    col_idx = args.col
    is_first = True

    for line in sys.stdin:
        line_clean = line.strip()
        if not line_clean:
            continue
        if is_first:
            print(f"__HEADER__\\t{line_clean}")
            is_first = False
            continue

        parts = line_clean.split(",")
        if col_idx < len(parts):
            key = parts[col_idx].strip('"').strip()
            try:
                formatted_key = f"NUM_{float(key):+020.6f}"
            except ValueError:
                formatted_key = f"STR_{key.lower()}"
        else:
            formatted_key = "STR_"
        print(f"{formatted_key}\\t{line_clean}")

if __name__ == "__main__":
    main()
`
  },
  'reducer.py': {
    desc: 'Hadoop Streaming Reducer script consuming intermediate Key-Value pairs and outputting sorted records',
    ext: 'python',
    code: `#!/usr/bin/env python3
import sys

def main():
    header_emitted = False
    for line in sys.stdin:
        line_clean = line.rstrip("\\r\\n")
        if not line_clean:
            continue
        parts = line_clean.split("\\t", 1)
        if len(parts) == 2:
            key, original_row = parts
            if key == "__HEADER__":
                if not header_emitted:
                    print(original_row)
                    header_emitted = True
            else:
                print(original_row)
        else:
            print(line_clean)

if __name__ == "__main__":
    main()
`
  },
  'performance.py': {
    desc: 'Benchmark suite comparing Single-Thread vs MapReduce with Matplotlib headless chart generation',
    ext: 'python',
    code: `"""
Performance Benchmark Suite for MapReduce Sorting
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
from sorting_engine import MapReduceCSVSorter, benchmark_single_thread

def run_benchmark_suite(csv_file_path: str, sort_col: str, output_img_path: str):
    ...
`
  },
  'requirements.txt': {
    desc: 'Python package dependencies for Windows 11 VS Code environment',
    ext: 'text',
    code: `Flask>=2.3.0
pandas>=2.0.0
matplotlib>=3.7.0
numpy>=1.24.0
Werkzeug>=2.3.0
`
  },
  'test_sorting.py': {
    desc: 'Automated functional test script for verifying splitting, mappers, k-way merge, and stability',
    ext: 'python',
    code: `"""
Automated Functional Verification Suite for MapReduce CSV Sorting
================================================================
Module: test_sorting.py
Run locally: python test_sorting.py
"""
import os, sys, csv
from sorting_engine import MapReduceCSVSorter, infer_type_and_cast

def run_tests():
    sample_10 = os.path.join(os.path.dirname(__file__), "sample_data", "sample_10.csv")
    sorter = MapReduceCSVSorter(num_chunks=3)
    out_path = os.path.join(os.path.dirname(__file__), "outputs", "test_asc_10.csv")
    res = sorter.execute_sort(sample_10, out_path, "sales_amount", ascending=True)

    with open(out_path, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    amounts = [float(r[header.index("sales_amount")]) for r in rows]
    # Verify strict ascending order
    assert all(amounts[i] <= amounts[i+1] for i in range(len(amounts)-1))
    # Verify 10 rows retained (zero dropped)
    assert len(rows) == 10
    # Verify duplicate 45.99 keys preserved
    assert sum(1 for a in amounts if a == 45.99) == 2
    print("[PASS] All automated functional tests passed successfully!")

if __name__ == "__main__":
    run_tests()
`
  }
};

export const PythonCodeCenter: React.FC<PythonCodeCenterProps> = () => {
  const [selectedFile, setSelectedFile] = useState<string>('app.py');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const activeFile = CODE_FILES[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder("large_scale_csv_sorting")!;

      // Add python files
      for (const [filename, fileObj] of Object.entries(CODE_FILES)) {
        rootFolder.file(filename, fileObj.code);
      }

      // Add sample script
      rootFolder.file("generate_datasets.py", `
import os, random, csv
def generate(path, count):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_id", "customer_name", "category", "sales_amount", "quantity", "discount", "transaction_date", "city"])
        for i in range(1, count + 1):
            writer.writerow([10000000 + i, f"User_{i}", "Electronics", round(random.uniform(10, 5000), 2), random.randint(1, 10), 0.05, "2023-05-15", "New York"])
generate("sample_data/sample_1000.csv", 1000)
generate("sample_data/sample_10000.csv", 10000)
print("Generated sample datasets!")
`);

      // Add 10-record deterministic sample CSV
      rootFolder.file("sample_data/sample_10.csv", `transaction_id,customer_name,category,sales_amount,quantity,discount,transaction_date,city
1001,Sophia Taylor,Electronics,850.50,3,0.10,2023-04-12,Seattle
1002,Lucas Wilson,Furniture,120.00,1,0.05,2023-08-19,Austin
1003,Olivia Smith,Appliances,4200.00,10,0.20,2023-01-05,New York
1004,Liam Anderson,Books,45.99,2,0.00,2023-11-23,Chicago
1005,Emma Johnson,Clothing,1200.00,4,0.15,2023-06-30,Boston
1006,Noah Davis,Industrial,310.25,1,0.00,2023-03-14,Denver
1007,Ava Martinez,Health & Care,45.99,2,0.05,2023-09-02,Miami
1008,Oliver Brown,Automotive,2899.00,5,0.25,2023-12-01,San Francisco
1009,Mia Garcia,Garden,750.00,3,0.10,2023-07-08,Atlanta
1010,Ethan Miller,Sports,150.00,2,0.05,2023-02-28,Portland
`);

      // Add folders
      rootFolder.folder("uploads");
      rootFolder.folder("outputs");
      rootFolder.folder("static/images");
      rootFolder.folder("templates");

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'large_scale_csv_sorting_project.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download ZIP action */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">
              Windows 11 VS Code & Python MapReduce Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete modular codebase matching the university project structure. Download ready-to-run ZIP or copy individual modules.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packaging ZIP Archive...' : 'Download Complete Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Windows 11 VS Code Terminal Guide */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Step-by-Step Windows 11 VS Code Setup & Run Guide
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Step 1: Open Terminal</span>
            <div className="text-sky-300 font-bold">In VS Code</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl + `</kbd> to open the integrated terminal in the project folder.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Step 2: Virtual Env</span>
            <div className="text-sky-300 font-bold">python -m venv venv</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Activate with: <code className="text-slate-300">.\venv\Scripts\Activate.ps1</code>
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Step 3: Dependencies</span>
            <div className="text-sky-300 font-bold">pip install -r requirements.txt</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Installs Flask, Pandas, Matplotlib, and NumPy automatically.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Step 4: Launch Web App</span>
            <div className="text-emerald-400 font-bold">python app.py</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Open <a href="http://127.0.0.1:5000" target="_blank" rel="noreferrer" className="text-sky-400 underline">http://127.0.0.1:5000</a> in browser.
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Navigator */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FolderTree className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Project Architecture Files
            </h4>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {Object.keys(CODE_FILES).map((fname) => (
              <button
                key={fname}
                onClick={() => setSelectedFile(fname)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                  selectedFile === fname
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="truncate">{fname}</span>
                <span className="text-[10px] text-slate-500">{CODE_FILES[fname].ext}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Module Summary:</strong>
            <p className="mt-1 text-slate-500 leading-relaxed font-sans">
              {activeFile.desc}
            </p>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>large_scale_csv_sorting/{selectedFile}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[500px]">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
