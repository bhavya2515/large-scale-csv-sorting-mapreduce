# Large-Scale CSV Sorting Using MapReduce
**An Academic Big Data Engineering Project**

---

## 1. Project Overview & Problem Statement

### 1.1 The Big Data Challenge
Modern enterprise data warehouses, IoT sensors, and financial exchanges generate multi-gigabyte or terabyte-scale Comma-Separated Values (CSV) logs daily. Standard in-memory sorting algorithms (such as Python's TimSort or Pandas `sort_values()`) load the entire dataset into RAM:
- If a dataset size exceeds available physical memory ($RAM < DataSize$), an **Out-Of-Memory (OOM) Fatal Crash** occurs.
- Single-threaded sorting cannot exploit modern multi-core CPUs or distributed clusters.

### 1.2 Project Objective
This project implements a scalable, memory-bounded, distributed **MapReduce Sorting Architecture** to sort large-scale CSV datasets deterministically. It demonstrates:
1. **Input Splitting**: Partitioning unbounded CSV streams into $K$ manageable chunks with headers preserved.
2. **Parallel Mapper Execution**: Utilizing Python `multiprocessing` worker pools to parse keys and sort chunk boundaries locally.
3. **Shuffle & Partition**: Emitting sorted partition descriptors and streaming handles.
4. **K-Way Min-Heap Merge Reducer**: Merging $K$ sorted streams with **$O(N \log K)$** time complexity and **$O(K)$** in-memory space complexity, guaranteeing a globally ordered CSV output.

---

## 2. Technology Stack

- **Primary Language**: Python 3.10+
- **Web Backend**: Flask
- **Data Processing**: Pandas, NumPy
- **Parallel Computing**: Python `multiprocessing` (CPU process pooling)
- **Visualization**: Matplotlib (headless `Agg` engine)
- **Big Data Streaming**: Hadoop Streaming compatibility (`mapper.py` and `reducer.py`)
- **Frontend**: HTML5, CSS3 (Modern Dark Slate Big Data Theme), Vanilla JavaScript

---

## 3. MapReduce Architecture Deep Dive

```
+-------------------------------------------------------------+
|                     Raw CSV Dataset                         |
|                    (e.g., 100,000 Rows)                     |
+-------------------------------------------------------------+
                              |
                     [Input Splitting]
                              |
       +--------------+-------+-------+--------------+
       |              |               |              |
       v              v               v              v
 +-----------+  +-----------+   +-----------+  +-----------+
 | Chunk 0   |  | Chunk 1   |   | Chunk 2   |  | Chunk 3   |
 +-----------+  +-----------+   +-----------+  +-----------+
       |              |               |              |
       v              v               v              v
  [Mapper 0]     [Mapper 1]      [Mapper 2]     [Mapper 3]
  Extract Key    Extract Key     Extract Key    Extract Key
  Local Sort     Local Sort      Local Sort     Local Sort
       |              |               |              |
       v              v               v              v
 +-----------+  +-----------+   +-----------+  +-----------+
 | Sorted P0 |  | Sorted P1 |   | Sorted P2 |  | Sorted P3 |
 +-----------+  +-----------+   +-----------+  +-----------+
       \              \               /              /
        \              \             /              /
         +--------------+-----------+--------------+
                                |
                     [Shuffle & Sort Phase]
            (Metadata coordination & stream iterators)
                                |
                                v
               [Reducer: K-Way Min-Heap Merge]
                     Priority Queue: O(K)
                 Global Merge: O(N * log K)
                                |
                                v
+-------------------------------------------------------------+
|                   Globally Sorted Output CSV                |
+-------------------------------------------------------------+
```

### Stage 1: Input Splitting
The dataset is streamed and partitioned into $K$ balanced chunks on disk. Crucially, each chunk receives the original CSV header row so downstream Mappers can identify columns independently.

### Stage 2: Parallel Mappers
Each Mapper process:
- Parses its assigned chunk.
- Casts the target sort key into its canonical comparable representation (Numeric `float`/`int`, DateTime, or case-insensitive text).
- Locally sorts the partition using TimSort ($O(M \log M)$ where $M = N/K$).
- Emits the locally sorted chunk back to disk.

### Stage 3: Shuffle and Partition
In true Hadoop clusters, the Shuffle phase routes intermediate Key-Value pairs between Mappers and Reducers over the network. In our high-throughput local engine, the Shuffle coordinator records the key boundaries (`min_key`, `max_key`, record count) and prepares file streaming pointers for the Reducer.

### Stage 4: K-Way Merge Reducer (Min-Heap)
To achieve a **global sort** without loading all records into RAM:
1. Open file pointers for all $K$ sorted chunks.
2. Initialize a Min-Heap (Priority Queue) with the first record from each chunk ($K$ elements).
3. In a loop:
   - Extract the minimum record (`heappop`).
   - Write that record into the global output CSV.
   - Read the next line from the chunk file that yielded the extracted record.
   - Insert it into the heap (`heappush`).
4. Repeat until all $K$ streams are exhausted.

**Complexity**:
- Time: $O(N \log K)$
- Auxiliary RAM: $O(K)$ — Only $K$ records reside in RAM at any instant!

---

## 4. Hadoop Streaming & TotalOrderPartitioner

### Why Doesn't Multiple Independent Reducers Produce a Global Sort?
In Apache Hadoop, the default partitioner is `HashPartitioner`, which sends records to Reducer $R$ based on:
$$\text{Reducer ID} = \text{hash}(key) \pmod{\text{num\_reducers}}$$
- Inside each Reducer, keys are sorted.
- However, Reducer 0 may receive key `10` and key `900`, while Reducer 1 receives `12` and `850`.
- The separate output files `part-00000` and `part-00001` are individually sorted, **but the overall dataset is NOT globally sorted**.

### The Solution:
1. **Single Reducer (`-D mapreduce.job.reduces=1`)**: Guarantees a single globally sorted file `part-00000`, but reducer throughput is bounded by 1 node.
2. **TotalOrderPartitioner**:
   - Uses Hadoop's `InputSampler` to sample the input keys.
   - Computes non-overlapping range cutoffs (e.g., Partition 0: keys 0–250, Partition 1: keys 251–500, Partition 2: keys 501–1000).
   - Concatenating `part-00000`, `part-00001`, etc., yields a 100% globally ordered dataset.

---

## 5. Windows 11 & VS Code Setup Instructions

Follow these step-by-step instructions to run the project locally on Windows 11.

### Step 1: Open Project in VS Code
1. Open **Visual Studio Code**.
2. Click **File -> Open Folder...** and select the `large_scale_csv_sorting` folder.
3. Open the integrated terminal using ``Ctrl + ` `` (Backtick).

### Step 2: Create a Python Virtual Environment
Run in the VS Code PowerShell terminal:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts execution scripts, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

### Step 3: Install Required Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Generate Sample Datasets
```powershell
python generate_datasets.py
```
This generates:
- `sample_data/sample_1000.csv` (1,000 records)
- `sample_data/sample_10000.csv` (10,000 records)

### Step 5: Start the Flask Web Application
```powershell
python app.py
```
Output:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```
Open **`http://127.0.0.1:5000`** in your browser (Google Chrome, Microsoft Edge, etc.).

---

## 6. Standalone CLI & Hadoop Streaming Execution

### Running the Python Standalone MapReduce Sorter
```powershell
python -c "from sorting_engine import MapReduceCSVSorter; sorter = MapReduceCSVSorter(num_chunks=4); print(sorter.execute_sort('sample_data/sample_1000.csv', 'outputs/sorted_cli.csv', 'sales_amount', ascending=True))"
```

### Running Hadoop Streaming Pipeline (Unix / WSL / Hadoop Cluster)
```bash
cat sample_data/sample_1000.csv | python3 mapper.py --col=3 | sort -k1,1 | python3 reducer.py > outputs/hadoop_sorted.csv
```

### Running Automated Functional Verification (10-Record Test Bed)
```powershell
python test_sorting.py
```
Performs automated assertions validating:
1. Input splitting into uniform chunk files with preserved headers.
2. Parallel mapper local sorting and key extraction.
3. K-way merge reducer global ascending monotonicity ($45.99 \rightarrow 4200.00$).
4. K-way merge reducer global descending monotonicity ($4200.00 \rightarrow 45.99$).
5. Stability and duplicate key preservation (neither duplicate 45.99 row dropped or overwritten).
6. Mathematical equivalence against ground-truth single-threaded TimSort.

---

## 7. College Project Demonstration & Viva Voce Q&A

### Q1: What is the main bottleneck in large-scale external sorting?
**Answer**: Disk I/O. In single-machine sorting, seeking across disk blocks dominates latency. MapReduce addresses this by processing sequential blocks (HDFS splits), performing fast sequential in-memory TimSort in parallel Mappers, and using sequential streaming reads during the K-way merge.

### Q2: Why use a Min-Heap for the K-way merge instead of repeated scanning?
**Answer**:
- Naive linear scan across $K$ heads to find the minimum takes $O(K)$ time per record, totaling $O(N \cdot K)$.
- A Min-Heap (Priority Queue) finds and replaces the minimum in $O(\log K)$ time. For $N$ records, total complexity is $O(N \log K)$. When $K=16$, $\log_2(16) = 4$, which is significantly faster than scanning.

### Q3: How do we prevent losing duplicate records during the merge?
**Answer**: By including a unique sequence counter in the tuple `(sort_key, chunk_id, sequence_id, raw_line)`. Even if two records share identical sort keys, the heap uses the unique sequence ID as a tie-breaker, preserving duplicate rows faithfully.

### Q4: How does this project differ from real distributed Hadoop?
**Answer**:
- This local Python implementation simulates MapReduce semantics using OS processes (`multiprocessing.Pool`) and local filesystem chunking.
- Real Apache Hadoop runs across multiple physical worker machines (DataNodes / NodeManagers) managed by YARN, communicating intermediate shuffle files over TCP/IP networks via HDFS.

---

## 8. Conclusion
The **Large-Scale CSV Sorting Using MapReduce** system successfully demonstrates how distributed MapReduce concepts solve big data scalability bottlenecks. By decoupling sorting into parallel partition mapping and memory-bounded K-way heap merging, datasets significantly larger than physical memory can be sorted reliably without system degradation.
