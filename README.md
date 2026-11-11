# Large-Scale CSV Sorting Using MapReduce
**An Academic Big Data Engineering & Distributed Systems Project**

![Big Data](https://img.shields.io/badge/Big_Data-MapReduce-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-green.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Flask](https://img.shields.io/badge/Flask-2.3%2B-lightgrey.svg)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)

---

## 1. Project Overview & Problem Statement

### 1.1 The Challenge of Sorting Big Data
In modern data engineering, IoT ecosystems, financial market logging, and enterprise warehouses, datasets frequently scale into hundreds of thousands or millions of records (multi-gigabyte to terabyte scales). 

Standard in-memory sorting algorithms (such as Python's TimSort or Pandas `sort_values()`) require loading the entire dataset into physical RAM:
- When the dataset size exceeds available physical memory ($RAM < DataSize$), an **Out-Of-Memory (OOM) fatal crash** occurs.
- Single-threaded sorting fails to utilize modern multi-core processors and distributed node architectures.

### 1.2 Project Objective
This project implements a scalable, memory-bounded **MapReduce CSV Sorting Architecture** that deterministically sorts massive datasets. It demonstrates:
1. **Input Splitting**: Dividing raw CSV streams into $K$ manageable partitions while preserving schema headers.
2. **Parallel Mappers**: Employing worker processes to parse typed keys and locally sort individual partitions.
3. **Shuffle & Partition**: Coordinating key distributions, partition boundaries, and intermediate stream descriptors.
4. **K-Way Min-Heap Merge Reducer**: Streaming records through an external binary priority queue with $\mathcal{O}(N \log K)$ time complexity and $\mathcal{O}(K)$ auxiliary RAM space complexity.

---

## 2. Technology Stack

- **Primary Languages**: Python 3.10+, TypeScript
- **Web Backend**: Flask, Python `multiprocessing.Pool`
- **Data Processing**: Pandas, NumPy, native streaming `csv`
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Motion
- **Visualization**: Headless Matplotlib (`Agg` engine) & SVG interactive analytics
- **Distributed Standard**: Apache Hadoop Streaming compatible (`mapper.py` & `reducer.py`)

---

## 3. System Architecture & MapReduce Workflow

```
+-------------------------------------------------------------+
|                     Raw CSV Dataset                         |
|             (e.g., 10 to 100,000+ Records)                  |
+-------------------------------------------------------------+
                              |
                    [1. Input Splitting]
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
                  [3. Shuffle & Partition Phase]
            (Metadata coordination & stream iterators)
                                |
                                v
               [4. Reducer: K-Way Min-Heap Merge]
                     Priority Queue: O(K)
                 Global Merge: O(N * log K)
                                |
                                v
+-------------------------------------------------------------+
|                 Globally Sorted Output CSV                  |
+-------------------------------------------------------------+
```

### Stage 1: Input Splitting
The raw CSV file is partitioned into $K$ balanced chunks on disk. Crucially, each chunk receives the original CSV header row so downstream Mappers can identify and extract columns independently.

### Stage 2: Parallel Mappers
Each Mapper process:
- Parses its assigned chunk file.
- Casts the target sort key into its canonical comparable representation (Numeric `float`/`int`, DateTime, or case-insensitive string).
- Locally sorts the partition using TimSort ($\mathcal{O}(M \log M)$ where $M = N/K$).
- Emits the locally sorted chunk back to disk with metadata (`min_key`, `max_key`, row count).

### Stage 3: Shuffle and Partition
In true Hadoop clusters, the Shuffle phase routes intermediate Key-Value pairs between Mappers and Reducers over the network. In our high-throughput local engine, the Shuffle coordinator records key boundaries and prepares file streaming pointers for the Reducer.

### Stage 4: K-Way Merge Reducer (Min-Heap Priority Queue)
To achieve a **global sort** without loading all records into RAM:
1. Open stream readers for all $K$ sorted chunks.
2. Initialize a Min-Heap (Priority Queue) with the first record from each chunk ($K$ elements).
3. In a loop:
   - Extract the minimum record (`heappop`).
   - Write that record into the global output CSV.
   - Read the next line from the chunk file that yielded the extracted record.
   - Insert it into the heap (`heappush`).
4. Repeat until all $K$ streams are exhausted.

**Algorithmic Complexity**:
- **Time Complexity**: $\mathcal{O}(N \log K)$
- **Auxiliary RAM Complexity**: $\mathcal{O}(K)$ — Only $K$ records reside in RAM at any instant, making it capable of sorting files far larger than physical RAM.

---

## 4. Hadoop Streaming vs. Local Simulation

| Architectural Dimension | **Our Local MapReduce Implementation** | **Enterprise Apache Hadoop Cluster** |
| :--- | :--- | :--- |
| **Execution Environment** | Single workstation utilizing CPU process pools (`multiprocessing.Pool`). | Distributed cluster of independent physical commodity servers (DataNodes / NodeManagers). |
| **Storage & I/O** | Local disk chunking and memory-buffered file descriptors. | Hadoop Distributed File System (**HDFS**) with 3x replication and rack awareness. |
| **Cluster Orchestration** | Local Python runtime / Express / Browser thread pool. | **YARN** (ResourceManager & NodeManagers). |
| **Global Sorting Across Reducers** | Guaranteed via a **K-Way Min-Heap Merge Reducer** with $\mathcal{O}(N \log K)$ time and $\mathcal{O}(K)$ RAM. | Default `HashPartitioner` only sorts *within* each reducer; achieving global sort requires **`TotalOrderPartitioner`** with `InputSampler`. |

---

## 5. Project Folder Structure

```
.
├── README.md                           # Master project documentation
├── package.json                        # Node dependencies & web scripts
├── tsconfig.json                       # TypeScript compiler configuration
├── vite.config.ts                      # Vite build configuration
├── index.html                          # Web application entry point
├── metadata.json                       # Applet configuration metadata
├── .env.example                        # Safe environment template (no credentials)
├── .gitignore                          # Clean repository filter
├── src/                                # React Interactive Big Data Dashboard
│   ├── App.tsx                         # Main container & stage controller
│   ├── components/                     # Modular UI components
│   │   ├── Header.tsx                  # Navigation & Test Application trigger
│   │   ├── DatasetUpload.tsx           # Drag & Drop uploader & sample selector
│   │   ├── ConfigurationPanel.tsx      # Column, chunk count & direction selector
│   │   ├── MapReducePipelineVisualizer.tsx # Live 4-Stage MapReduce DAG Visualizer
│   │   ├── ResultsTable.tsx            # Paginated table, search & CSV downloader
│   │   ├── PerformanceBenchmark.tsx    # Multi-core latency & throughput charts
│   │   ├── HadoopVivaLab.tsx           # TotalOrderPartitioner vs HashPartitioner
│   │   ├── PythonCodeCenter.tsx        # Source code viewer & 1-click ZIP exporter
│   │   └── TestApplicationModal.tsx    # Automated functional verification modal
│   ├── engine/                         # Algorithms & verification
│   │   ├── mapReduceEngine.ts          # Core TS MapReduce & K-way heap reducer
│   │   └── functionalTestSuite.ts     # Automated testing suite
│   ├── data/                           # Data synthesis
│   │   ├── sampleDatasets.ts           # 10, 1k, 5k, 10k, 25k record generators
│   │   └── vivaData.ts                 # Exam questions & scoring criteria
│   └── types/index.ts                  # Type definitions
└── large_scale_csv_sorting/            # Python Flask & Multiprocessing Backend
    ├── app.py                          # Flask web application controller & routes
    ├── requirements.txt                # Python package dependencies
    ├── README.md                       # Python project documentation
    ├── mapper.py                       # Hadoop Streaming & standalone mapper
    ├── reducer.py                      # Hadoop Streaming & K-Way reducer
    ├── sorting_engine.py               # Core Python MapReduce engine
    ├── performance.py                  # Matplotlib performance benchmark suite
    ├── test_sorting.py                 # Automated functional testing script
    ├── generate_datasets.py            # Dataset generator (10, 1k, 10k rows)
    ├── sample_data/                    # Pre-packaged benchmark CSV datasets
    │   ├── sample_10.csv               # 10-record deterministic test bed
    │   ├── sample_1000.csv             # 1,000 retail records
    │   └── sample_10000.csv            # 10,000 transaction records
    ├── templates/                      # Flask HTML templates
    │   ├── index.html
    │   ├── dashboard.html
    │   └── results.html
    ├── static/                         # CSS, JS, and Matplotlib chart images
    ├── uploads/                        # Clean upload directory (.gitkeep)
    └── outputs/                        # Clean output directory (.gitkeep)
```

---

## 6. Installation & Execution Instructions

### Option A: Running the Web Application (Node.js & React)

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the development server**:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

### Option B: Running the Python Flask Backend (Windows 11 / VS Code)

1. **Open the project folder in VS Code**:
   ```powershell
   cd large_scale_csv_sorting
   ```
2. **Create and activate a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. **Install Python dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```
4. **Run the Automated Functional Verification Suite**:
   ```powershell
   python test_sorting.py
   ```
5. **Start the Flask Web Server**:
   ```powershell
   python app.py
   ```
   Open `http://127.0.0.1:5000` in your browser.

---

### Option C: Standalone CLI & Hadoop Streaming Pipeline

```bash
# Unix / WSL Hadoop Streaming pipe test:
cat sample_data/sample_1000.csv | python3 mapper.py --col=3 | sort -k1,1 | python3 reducer.py > outputs/hadoop_sorted.csv
```

---

## 7. Automated Functional Testing & Verification

The project includes an **automated testing suite** accessible via the **"Test Application"** button in the web UI or via `python test_sorting.py`:

| Test ID | Test Category | Description | Verification Criterion | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Parsing | CSV Header Schema & Type Validation | Detects all 8 columns and numeric types | **PASSED** |
| **TC-02** | Splitting | Input Splitting & Partition Distribution | $K=3$ uniform chunks with headers | **PASSED** |
| **TC-03** | Mapper | Mapper Key Extraction & Local Partition Sort | $\text{minKey} \le \text{maxKey}$ in each chunk | **PASSED** |
| **TC-04** | Ordering | K-Way Merge Reducer Global Ascending Order | Strictly non-decreasing ($45.99 \rightarrow 4200.00$) | **PASSED** |
| **TC-05** | Ordering | K-Way Merge Reducer Global Descending Order | Strictly non-increasing ($4200.00 \rightarrow 45.99$) | **PASSED** |
| **TC-06** | Integrity | Duplicate Key Stability & Record Retention | Both 45.99 rows retained; 0 dropped rows | **PASSED** |
| **TC-07** | Ordering | Text / Lexicographical Key Sorting | A $\rightarrow$ Z alphabetical order verified | **PASSED** |
| **TC-08** | Integrity | Ground-Truth TimSort Equivalence | 100% match with single-threaded TimSort | **PASSED** |

---

## 8. Screenshots & User Interface Walkthrough

1. **Dashboard & Upload Area**:
   - Modern Dark Slate Big Data theme with drag-and-drop CSV uploader.
   - One-click buttons to load **10 Records**, **1,000 Records**, **5,000 Records**, **10,000 Records**, or **25,000 Records**.
2. **Sorting Configuration Panel**:
   - Interactive dropdown to select the target sort column with type badges (`NUM`, `TEXT`, `DATE`).
   - Order toggle (**Ascending** / **Descending**) and chunk partition selector ($K = 2, 4, 8, 16$).
3. **MapReduce DAG Visualizer**:
   - Real-time animated pipeline showing Input Splitting $\rightarrow$ Parallel Mappers $\rightarrow$ Shuffle Coordinator $\rightarrow$ K-Way Heap Reducer.
   - Individual worker partition diagnostic cards displaying rows processed, `minKey`, `maxKey`, and latency.
4. **Results Table**:
   - Paginated table with search filtering and active sort key highlighting (`▲ KEY`).
   - Direct **"Download CSV"** button generating an RFC 4180 compliant sorted CSV.
5. **Performance Lab**:
   - Empirically compares Single-Thread vs MapReduce (2, 4, 8, 16 chunks).
   - Visual execution latency bar charts, throughput curves (rows/sec), and stage latency breakdown table.
6. **Hadoop Architecture & Viva Voce Lab**:
   - Interactive `TotalOrderPartitioner` vs `HashPartitioner` demonstrator.
   - HDFS InputSplit calculator based on block size (64 MB vs 128 MB).
   - High-scoring Viva Voce exam flashcards.
7. **Python Code Center**:
   - Integrated source code viewer with copy buttons and a one-click **"Download Complete Project (.ZIP)"** exporter.

---

## 9. Sample Input & Output Data

### Sample Input (`sample_10.csv`):
```csv
transaction_id,customer_name,category,sales_amount,quantity,discount,transaction_date,city
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
```

### Globally Sorted Output (by `sales_amount` Ascending):
```csv
transaction_id,customer_name,category,sales_amount,quantity,discount,transaction_date,city
1004,Liam Anderson,Books,45.99,2,0.00,2023-11-23,Chicago
1007,Ava Martinez,Health & Care,45.99,2,0.05,2023-09-02,Miami
1002,Lucas Wilson,Furniture,120.00,1,0.05,2023-08-19,Austin
1010,Ethan Miller,Sports,150.00,2,0.05,2023-02-28,Portland
1006,Noah Davis,Industrial,310.25,1,0.00,2023-03-14,Denver
1009,Mia Garcia,Garden,750.00,3,0.10,2023-07-08,Atlanta
1001,Sophia Taylor,Electronics,850.50,3,0.10,2023-04-12,Seattle
1005,Emma Johnson,Clothing,1200.00,4,0.15,2023-06-30,Boston
1008,Oliver Brown,Automotive,2899.00,5,0.25,2023-12-01,San Francisco
1003,Olivia Smith,Appliances,4200.00,10,0.20,2023-01-05,New York
```

---

## 10. College Project Viva Voce Q&A

**Q1: Why doesn't standard Hadoop guarantee global sort with multiple reducers?**  
*Answer*: Hadoop's default `HashPartitioner` assigns records by `hash(key) % num_reducers`. While each individual reducer output file (`part-00000`, `part-00001`) is locally sorted, keys are scattered. Global sort across multiple reducers requires `TotalOrderPartitioner` with an `InputSampler`. In our local simulation, global ordering is achieved via a K-Way Min-Heap Merge Reducer.

**Q2: What is the time complexity of the K-Way Merge Reducer?**  
*Answer*: For $N$ records divided across $K$ chunks, inserting and popping from the Min-Heap takes $\mathcal{O}(\log K)$. Across all $N$ records, total merge time is **$\mathcal{O}(N \log K)$**, with memory usage bounded at **$\mathcal{O}(K)$**.

**Q3: How do we prevent losing duplicate records during the merge?**  
*Answer*: Each heap entry is encapsulated as `(sort_key, chunk_id, sequence_id, raw_line)`. The unique monotonic `sequence_id` acts as a deterministic tie-breaker, guaranteeing zero duplicate data loss.

---

## 11. Conclusion
The **Large-Scale CSV Sorting Using MapReduce** system demonstrates how distributed computing paradigms overcome memory bottlenecks. By decomposing large-scale sorting into parallel partition mapping and memory-bounded K-way heap merging, datasets substantially larger than physical RAM can be sorted deterministically and efficiently.
