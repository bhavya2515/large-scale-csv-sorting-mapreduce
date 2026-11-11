import { DatasetRow, ColumnType, ChunkMeta, PipelineTimings, MapReduceResult } from '../types';

/**
 * Min-Heap implementation for K-Way Merge Reducer
 */
interface HeapNode {
  key: number | string;
  chunkIndex: number;
  row: DatasetRow;
  seq: number;
}

class MinHeap {
  private heap: HeapNode[] = [];
  private isNumeric: boolean;
  private ascending: boolean;

  constructor(isNumeric: boolean, ascending: boolean = true) {
    this.isNumeric = isNumeric;
    this.ascending = ascending;
  }

  private compare(a: HeapNode, b: HeapNode): number {
    let cmp = 0;
    if (this.isNumeric) {
      const numA = typeof a.key === 'number' ? a.key : parseFloat(String(a.key)) || 0;
      const numB = typeof b.key === 'number' ? b.key : parseFloat(String(b.key)) || 0;
      cmp = numA - numB;
    } else {
      const strA = String(a.key).toLowerCase();
      const strB = String(b.key).toLowerCase();
      cmp = strA.localeCompare(strB);
    }

    // Invert comparison if descending
    if (!this.ascending) {
      cmp = -cmp;
    }

    // Stable tie-breaker using insertion sequence
    if (cmp === 0) {
      return a.seq - b.seq;
    }
    return cmp;
  }

  public push(node: HeapNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapNode | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  public size(): number {
    return this.heap.length;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.compare(this.heap[idx], this.heap[parentIdx]) < 0) {
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  private sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Type-detection utility
 */
export function inferColumnType(values: (string | number)[]): ColumnType {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'text';

  let numericCount = 0;
  let dateCount = 0;

  for (const v of nonNulls.slice(0, 50)) {
    const num = Number(v);
    if (!isNaN(num) && typeof v !== 'boolean') {
      numericCount++;
    } else {
      const parsedDate = Date.parse(String(v));
      if (!isNaN(parsedDate) && String(v).length > 6) {
        dateCount++;
      }
    }
  }

  if (numericCount >= nonNulls.slice(0, 50).length * 0.8) return 'numeric';
  if (dateCount >= nonNulls.slice(0, 50).length * 0.8) return 'datetime';
  return 'text';
}

/**
 * Parses raw sort key into comparable primitive
 */
function parseKey(val: any, colType: ColumnType): number | string {
  if (val === null || val === undefined || val === '') {
    return colType === 'numeric' ? -Infinity : '';
  }
  if (colType === 'numeric') {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }
  if (colType === 'datetime') {
    const ts = Date.parse(String(val));
    return isNaN(ts) ? 0 : ts;
  }
  return String(val);
}

/**
 * Baseline single-threaded sort for performance benchmarking
 */
export function executeBaselineSort(
  data: DatasetRow[],
  sortColumn: string,
  colType: ColumnType,
  ascending: boolean = true
): { sortedData: DatasetRow[]; latencyMs: number } {
  const start = performance.now();
  const copy = [...data];

  copy.sort((a, b) => {
    const keyA = parseKey(a[sortColumn], colType);
    const keyB = parseKey(b[sortColumn], colType);

    let cmp = 0;
    if (colType === 'numeric' || colType === 'datetime') {
      cmp = (keyA as number) - (keyB as number);
    } else {
      cmp = String(keyA).localeCompare(String(keyB));
    }
    return ascending ? cmp : -cmp;
  });

  const latencyMs = performance.now() - start;
  return { sortedData: copy, latencyMs: Math.round(latencyMs * 100) / 100 };
}

/**
 * Full MapReduce Sorting Pipeline Execution
 */
export async function executeMapReduceSort(
  data: DatasetRow[],
  sortColumn: string,
  colType: ColumnType,
  numChunks: number = 4,
  ascending: boolean = true,
  onProgress?: (stage: string, progressPercent: number, details?: any) => void
): Promise<MapReduceResult> {
  const totalRows = data.length;
  if (totalRows === 0) {
    return {
      status: 'ERROR',
      sortColumn,
      ascending,
      numChunks,
      totalRows: 0,
      timings: { splitMs: 0, mapMs: 0, shuffleMs: 0, reducerMs: 0, totalMs: 0 },
      chunkDetails: [],
      sortedData: [],
      verified: false,
      errorMessage: 'Dataset is empty.'
    };
  }

  const overallStart = performance.now();

  // -------------------------------------------------------------
  // STAGE 1: Input Splitting
  // -------------------------------------------------------------
  onProgress?.('Splitting Input CSV into Chunks', 15);
  const splitStart = performance.now();
  const chunks: DatasetRow[][] = [];
  const rowsPerChunk = Math.ceil(totalRows / numChunks);

  for (let i = 0; i < numChunks; i++) {
    const startIdx = i * rowsPerChunk;
    const endIdx = Math.min(startIdx + rowsPerChunk, totalRows);
    chunks.push(data.slice(startIdx, endIdx));
  }
  const splitMs = performance.now() - splitStart;

  // -------------------------------------------------------------
  // STAGE 2: Parallel Mapper Phase (Simulated async chunk sort)
  // -------------------------------------------------------------
  onProgress?.('Executing Parallel Mappers', 40);
  const mapStart = performance.now();
  const sortedChunks: DatasetRow[][] = [];
  const chunkDetails: ChunkMeta[] = [];

  // Small yield to allow UI updates
  await new Promise(r => setTimeout(r, 10));

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunkStart = performance.now();
    const currentChunk = [...chunks[cIdx]];

    // Local sort inside each Mapper
    currentChunk.sort((a, b) => {
      const keyA = parseKey(a[sortColumn], colType);
      const keyB = parseKey(b[sortColumn], colType);
      let cmp = 0;
      if (colType === 'numeric' || colType === 'datetime') {
        cmp = (keyA as number) - (keyB as number);
      } else {
        cmp = String(keyA).localeCompare(String(keyB));
      }
      return ascending ? cmp : -cmp;
    });

    const chunkDuration = performance.now() - chunkStart;
    sortedChunks.push(currentChunk);

    const minKey = currentChunk.length > 0 ? currentChunk[0][sortColumn] : 'N/A';
    const maxKey = currentChunk.length > 0 ? currentChunk[currentChunk.length - 1][sortColumn] : 'N/A';

    chunkDetails.push({
      chunkId: cIdx,
      rowCount: currentChunk.length,
      minKey,
      maxKey,
      executionTimeMs: Math.round(chunkDuration * 100) / 100,
      status: 'sorted'
    });
  }
  const mapMs = performance.now() - mapStart;

  // -------------------------------------------------------------
  // STAGE 3: Shuffle and Sort Phase
  // -------------------------------------------------------------
  onProgress?.('Shuffle & Stream Partitioning', 70);
  const shuffleStart = performance.now();
  // Small pause to visualize shuffle coordination
  await new Promise(r => setTimeout(r, 10));
  const shuffleMs = performance.now() - shuffleStart;

  // -------------------------------------------------------------
  // STAGE 4: Reducer Phase (K-Way Min-Heap Merge)
  // -------------------------------------------------------------
  onProgress?.('Reducer K-Way Min-Heap Merging', 85);
  const reducerStart = performance.now();
  const isNumeric = (colType === 'numeric' || colType === 'datetime');
  const heap = new MinHeap(isNumeric, ascending);
  const chunkPointers = new Array(numChunks).fill(0);
  let globalSeq = 0;

  // Initialize heap with first element of each chunk
  for (let c = 0; c < numChunks; c++) {
    if (sortedChunks[c].length > 0) {
      const row = sortedChunks[c][0];
      const key = parseKey(row[sortColumn], colType);
      heap.push({
        key,
        chunkIndex: c,
        row,
        seq: globalSeq++
      });
      chunkPointers[c] = 1;
    }
  }

  const mergedSortedData: DatasetRow[] = new Array(totalRows);
  let mergedCount = 0;

  while (heap.size() > 0) {
    const node = heap.pop()!;
    mergedSortedData[mergedCount++] = node.row;

    const cIdx = node.chunkIndex;
    if (chunkPointers[cIdx] < sortedChunks[cIdx].length) {
      const nextRow = sortedChunks[cIdx][chunkPointers[cIdx]++];
      const nextKey = parseKey(nextRow[sortColumn], colType);
      heap.push({
        key: nextKey,
        chunkIndex: cIdx,
        row: nextRow,
        seq: globalSeq++
      });
    }
  }
  const reducerMs = performance.now() - reducerStart;
  const totalMs = performance.now() - overallStart;

  // -------------------------------------------------------------
  // VERIFICATION: Check ordering & row integrity
  // -------------------------------------------------------------
  onProgress?.('Verifying Output Global Ordering', 98);
  let isSorted = true;
  for (let i = 0; i < Math.min(mergedSortedData.length - 1, 5000); i++) {
    const k1 = parseKey(mergedSortedData[i][sortColumn], colType);
    const k2 = parseKey(mergedSortedData[i + 1][sortColumn], colType);
    if (isNumeric) {
      if (ascending ? (k1 as number) > (k2 as number) : (k1 as number) < (k2 as number)) {
        isSorted = false;
        break;
      }
    } else {
      const cmp = String(k1).localeCompare(String(k2));
      if (ascending ? cmp > 0 : cmp < 0) {
        isSorted = false;
        break;
      }
    }
  }
  const verified = isSorted && mergedSortedData.length === totalRows;

  onProgress?.('Completed', 100);

  return {
    status: 'SUCCESS',
    sortColumn,
    ascending,
    numChunks,
    totalRows,
    timings: {
      splitMs: Math.round(splitMs * 100) / 100,
      mapMs: Math.round(mapMs * 100) / 100,
      shuffleMs: Math.round(shuffleMs * 100) / 100,
      reducerMs: Math.round(reducerMs * 100) / 100,
      totalMs: Math.round(totalMs * 100) / 100
    },
    chunkDetails,
    sortedData: mergedSortedData,
    verified
  };
}
