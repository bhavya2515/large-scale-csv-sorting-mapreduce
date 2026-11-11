"""
Large-Scale CSV Sorting Using MapReduce
=======================================
Module: performance.py
Description:
    Benchmarks single-threaded vs. MapReduce sorting across multiple dataset sizes
    and chunk configurations. Generates performance comparison charts using Matplotlib.
"""

import os
import time
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Headless backend for web servers
import matplotlib.pyplot as plt
from sorting_engine import MapReduceCSVSorter, benchmark_single_thread


def run_benchmark_suite(csv_file_path: str, sort_col: str, output_img_path: str) -> dict:
    """
    Runs benchmark comparing:
    - Single-threaded Python sort
    - MapReduce with 2 chunks
    - MapReduce with 4 chunks
    - MapReduce with 8 chunks
    Generates comparison bar and line charts saved to output_img_path.
    """
    df = pd.read_csv(csv_file_path)
    total_records = len(df)

    results = {
        "dataset_rows": total_records,
        "sort_column": sort_col,
        "experiments": []
    }

    # 1. Single Thread Baseline
    print(f"Running baseline single-threaded sort on {total_records} records...")
    t_single = benchmark_single_thread(csv_file_path, sort_col, ascending=True)
    results["experiments"].append({
        "name": "Standard Single-Thread",
        "type": "Single-Thread",
        "chunks": 1,
        "time_sec": t_single,
        "throughput_rows_sec": round(total_records / max(0.0001, t_single), 1)
    })

    # 2. MapReduce with various chunk sizes
    for num_chunks in [2, 4, 8]:
        print(f"Running MapReduce with {num_chunks} chunks...")
        sorter = MapReduceCSVSorter(num_chunks=num_chunks)
        temp_out = f"/tmp/bench_mr_{num_chunks}.csv"
        try:
            mr_res = sorter.execute_sort(csv_file_path, temp_out, sort_col, ascending=True)
            results["experiments"].append({
                "name": f"MapReduce ({num_chunks} Chunks)",
                "type": "MapReduce",
                "chunks": num_chunks,
                "time_sec": mr_res["timings"]["total_time_sec"],
                "split_time": mr_res["timings"]["split_time_sec"],
                "mapper_time": mr_res["timings"]["mapper_time_sec"],
                "shuffle_time": mr_res["timings"]["shuffle_time_sec"],
                "reducer_time": mr_res["timings"]["reducer_time_sec"],
                "throughput_rows_sec": round(total_records / max(0.0001, mr_res["timings"]["total_time_sec"]), 1)
            })
        finally:
            if os.path.exists(temp_out):
                os.remove(temp_out)

    # 3. Generate Matplotlib visualization
    os.makedirs(os.path.dirname(os.path.abspath(output_img_path)), exist_ok=True)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5))
    fig.patch.set_facecolor('#0f172a') # dark background

    for ax in (ax1, ax2):
        ax.set_facecolor('#1e293b')
        ax.tick_params(colors='#e2e8f0')
        ax.xaxis.label.set_color('#94a3b8')
        ax.yaxis.label.set_color('#94a3b8')
        ax.title.set_color('#f8fafc')
        for spine in ax.spines.values():
            spine.set_color('#334155')

    # Chart 1: Execution Time Bar Chart
    names = [e["name"] for e in results["experiments"]]
    times = [e["time_sec"] for e in results["experiments"]]
    colors = ['#38bdf8', '#818cf8', '#6366f1', '#4f46e5']

    bars = ax1.bar(names, times, color=colors, width=0.55, edgecolor='#475569')
    ax1.set_ylabel("Execution Time (seconds)", fontsize=11, fontweight='bold')
    ax1.set_title(f"Sorting Latency Comparison ({total_records:,} Rows)", fontsize=13, pad=12)
    ax1.grid(axis='y', linestyle='--', alpha=0.3, color='#64748b')
    plt.setp(ax1.get_xticklabels(), rotation=15, ha='right', fontsize=9)

    # Add data labels
    for bar in bars:
        h = bar.get_height()
        ax1.annotate(f"{h:.3f}s",
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 4), textcoords="offset points",
                    ha='center', va='bottom', color='#f8fafc', fontweight='bold', fontsize=9)

    # Chart 2: Throughput (Rows/sec) Line/Bar Chart
    throughputs = [e["throughput_rows_sec"] for e in results["experiments"]]
    ax2.plot(names, throughputs, marker='o', linewidth=2.5, markersize=8, color='#10b981', label='Throughput (Rows/s)')
    ax2.fill_between(range(len(names)), throughputs, color='#10b981', alpha=0.15)
    ax2.set_ylabel("Throughput (Rows / Second)", fontsize=11, fontweight='bold')
    ax2.set_title("Processing Throughput (Higher is Better)", fontsize=13, pad=12)
    ax2.grid(True, linestyle='--', alpha=0.3, color='#64748b')
    plt.setp(ax2.get_xticklabels(), rotation=15, ha='right', fontsize=9)

    for i, txt in enumerate(throughputs):
        ax2.annotate(f"{int(txt):,}/s", (i, throughputs[i]),
                    textcoords="offset points", xytext=(0, 8),
                    ha='center', color='#34d399', fontweight='bold', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_img_path, dpi=200, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

    results["chart_path"] = output_img_path
    return results


if __name__ == "__main__":
    import sys
    test_csv = sys.argv[1] if len(sys.argv) > 1 else "sample_data/sample_10000.csv"
    col = sys.argv[2] if len(sys.argv) > 2 else "sales_amount"
    out_img = "static/images/performance_comparison.png"
    if os.path.exists(test_csv):
        res = run_benchmark_suite(test_csv, col, out_img)
        print("Benchmark Complete:", res)
    else:
        print(f"File {test_csv} not found. Please provide a valid CSV file.")
