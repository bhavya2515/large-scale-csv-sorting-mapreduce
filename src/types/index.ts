export type ColumnType = 'numeric' | 'text' | 'datetime';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  sample: string | number;
}

export type DatasetRow = Record<string, string | number>;

export interface Dataset {
  id: string;
  name: string;
  rowCount: number;
  columns: ColumnMeta[];
  data: DatasetRow[];
  fileSizeFormatted: string;
  isCustomUpload?: boolean;
}

export interface ChunkMeta {
  chunkId: number;
  rowCount: number;
  minKey: string | number;
  maxKey: string | number;
  executionTimeMs: number;
  status: 'pending' | 'processing' | 'sorted';
}

export interface PipelineTimings {
  splitMs: number;
  mapMs: number;
  shuffleMs: number;
  reducerMs: number;
  totalMs: number;
}

export interface IntermediatePair {
  key: string | number;
  chunkId: number;
  rowPreview: string;
}

export interface MapReduceResult {
  status: 'SUCCESS' | 'ERROR';
  sortColumn: string;
  ascending: boolean;
  numChunks: number;
  totalRows: number;
  timings: PipelineTimings;
  chunkDetails: ChunkMeta[];
  sortedData: DatasetRow[];
  verified: boolean;
  errorMessage?: string;
}

export interface BenchmarkExperiment {
  name: string;
  type: 'Single-Thread' | 'MapReduce';
  chunks: number;
  timeMs: number;
  throughputRowsSec: number;
  timings?: PipelineTimings;
}

export interface BenchmarkReport {
  rowCount: number;
  sortColumn: string;
  experiments: BenchmarkExperiment[];
  timestamp: string;
}
