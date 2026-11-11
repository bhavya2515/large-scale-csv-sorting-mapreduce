export interface VivaQuestion {
  id: string;
  category: 'MapReduce Internals' | 'Sorting Algorithms' | 'Hadoop vs Simulation' | 'Optimization & Performance';
  question: string;
  answer: string;
  keyPoints: string[];
  complexityFormula?: string;
}

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    id: 'viva-1',
    category: 'MapReduce Internals',
    question: 'Why doesn\'t running multiple standard Hadoop Reducers automatically produce a globally sorted file?',
    answer: 'In Apache Hadoop, the default partitioner is HashPartitioner, which computes the target reducer using hash(key) % num_reducers. While each reducer locally sorts its designated partitions (producing sorted part-00000, part-00001, etc.), keys are dispersed across arbitrary reducers. Therefore, concatenating the output files results in an unsorted global sequence.',
    keyPoints: [
      'HashPartitioner distributes keys by hash, not contiguous numerical or lexicographical ranges',
      'Each reducer output file is only locally sorted',
      'Global sort requires either a single reducer (-D mapreduce.job.reduces=1) or TotalOrderPartitioner'
    ]
  },
  {
    id: 'viva-2',
    category: 'MapReduce Internals',
    question: 'How does Hadoop\'s TotalOrderPartitioner solve the global sorting challenge across multiple reducers?',
    answer: 'TotalOrderPartitioner uses an InputSampler to sample the input dataset prior to the main job. It calculates non-overlapping range cutoffs (split points) based on key distribution. Reducer 0 receives [min, split1], Reducer 1 receives [split1, split2], etc. As a result, part-00000 followed by part-00001 guarantees a strictly monotonic global sort across the entire cluster.',
    keyPoints: [
      'InputSampler inspects a representative statistical subset of keys',
      'Partitioner assigns contiguous non-overlapping key ranges to separate reducers',
      'Enables true parallel distributed global sorting across thousands of nodes'
    ]
  },
  {
    id: 'viva-3',
    category: 'Sorting Algorithms',
    question: 'What is the algorithmic time and space complexity of the K-Way Min-Heap Merge Reducer?',
    answer: 'For a dataset with N total records divided into K sorted partitions, the reducer maintains a binary min-heap of size K. Extracting the minimum element and inserting the subsequent record from the corresponding chunk stream takes O(log K) operations. Performing this for all N records yields a total time complexity of O(N log K). The auxiliary memory complexity is O(K), keeping only the current head of each stream in RAM.',
    keyPoints: [
      'Time Complexity: O(N log K)',
      'Auxiliary Space Complexity: O(K)',
      'Enables sorting datasets far larger than available RAM (External Merge Sort)'
    ],
    complexityFormula: 'Time = O(N \\cdot \\log_2 K) \\quad | \\quad Space = O(K)'
  },
  {
    id: 'viva-4',
    category: 'Hadoop vs Simulation',
    question: 'What is the architectural difference between our Python multiprocessing simulation and real Apache Hadoop?',
    answer: 'Our local engine simulates MapReduce paradigms on a single multi-core workstation: input splitting creates local temporary files, Mappers run as OS worker processes via multiprocessing.Pool, and the Reducer runs a K-way heap merge. In contrast, true Apache Hadoop runs across a distributed cluster of independent commodity servers, using HDFS for fault-tolerant data storage, YARN for cluster resource negotiation, and network shuffling over TCP/IP.',
    keyPoints: [
      'Local simulation uses shared CPU cores and local filesystem I/O',
      'Hadoop clusters feature distributed DataNodes, HDFS replication, and network shuffle',
      'Simulation accurately models the algorithmic stages without cloud infrastructure overhead'
    ]
  },
  {
    id: 'viva-5',
    category: 'Optimization & Performance',
    question: 'What is "Spilling" in the MapReduce Shuffle phase and how does it prevent Out-Of-Memory (OOM) errors?',
    answer: 'During the Map phase, intermediate key-value pairs are initially accumulated in an in-memory circular buffer (typically 100 MB by default). When the buffer reaches its threshold (e.g. 80%), a background thread spills the buffer contents to local disk after performing a local sort. Multiple spill files are later merged into a single partitioned file, preventing mapper processes from exhausting RAM.',
    keyPoints: [
      'Map-side circular buffer buffers intermediate (Key, Value) pairs',
      'Spills to disk at 80% capacity to avoid memory exhaustion',
      'Spill files are merged sequentially before transfer to Reducers'
    ]
  },
  {
    id: 'viva-6',
    category: 'Sorting Algorithms',
    question: 'How do we handle duplicate keys without losing records in the Reducer heap?',
    answer: 'To guarantee stability and prevent duplicate data loss, each heap entry is encapsulated as a tuple: (sort_key, chunk_id, sequence_id, row_data). If two records share an identical sort_key, Python and JavaScript fall back to the monotonic sequence_id as a deterministic tie-breaker, guaranteeing that all records are preserved and popped in predictable FIFO order.',
    keyPoints: [
      'Tie-breaker sequence counter attached to each record',
      'Prevents loss or overwriting of identical keys',
      'Maintains original column integrity and row count matching'
    ]
  }
];
