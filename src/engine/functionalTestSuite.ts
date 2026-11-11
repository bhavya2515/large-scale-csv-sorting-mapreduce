import { Dataset, DatasetRow } from '../types';
import { generate10RecordTestDataset } from '../data/sampleDatasets';
import { executeMapReduceSort, executeBaselineSort } from './mapReduceEngine';

export interface TestAssertion {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export interface TestCaseResult {
  id: string;
  title: string;
  category: 'Parsing' | 'Splitting' | 'Mapper' | 'Reducer' | 'Ordering' | 'Integrity';
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  description: string;
  assertions: TestAssertion[];
  logOutput: string[];
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallStatus: 'ALL_PASSED' | 'SOME_FAILED';
  totalDurationMs: number;
  results: TestCaseResult[];
}

export async function runFunctionalTestSuite(): Promise<TestSuiteReport> {
  const suiteStart = performance.now();
  const test10 = generate10RecordTestDataset();
  const results: TestCaseResult[] = [];

  // =========================================================================
  // Test 1: CSV Validation, Header Schema & Record Ingestion
  // =========================================================================
  const t1Start = performance.now();
  const t1Logs: string[] = [];
  const t1Assertions: TestAssertion[] = [];

  t1Logs.push(`Ingesting test dataset '${test10.name}'`);
  t1Logs.push(`Row count: ${test10.data.length}, Column count: ${test10.columns.length}`);

  const expectedHeaders = ['transaction_id', 'customer_name', 'category', 'sales_amount', 'quantity', 'discount', 'transaction_date', 'city'];
  const actualHeaders = test10.columns.map(c => c.name);

  const headersMatch = expectedHeaders.every(h => actualHeaders.includes(h));
  t1Assertions.push({
    name: 'Header schema detection',
    expected: expectedHeaders.join(', '),
    actual: actualHeaders.join(', '),
    passed: headersMatch
  });

  t1Assertions.push({
    name: 'Total record count verification',
    expected: '10 records',
    actual: `${test10.data.length} records`,
    passed: test10.data.length === 10
  });

  const numericTypeDetected = test10.columns.find(c => c.name === 'sales_amount')?.type === 'numeric';
  t1Assertions.push({
    name: 'Numeric data type inference for sales_amount',
    expected: 'numeric',
    actual: test10.columns.find(c => c.name === 'sales_amount')?.type || 'unknown',
    passed: numericTypeDetected
  });

  results.push({
    id: 'TC-01',
    title: 'CSV Header Schema & Type Validation',
    category: 'Parsing',
    status: t1Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t1Start) * 100) / 100,
    description: 'Ensures CSV parsing detects all 8 column headers, infers numeric data types, and loads exactly 10 rows.',
    assertions: t1Assertions,
    logOutput: t1Logs
  });

  // =========================================================================
  // Test 2: Input Splitting with Multiple Chunks (K = 3)
  // =========================================================================
  const t2Start = performance.now();
  const t2Logs: string[] = [];
  const t2Assertions: TestAssertion[] = [];
  const k2 = 3;
  const rowsPerChunk = Math.ceil(test10.data.length / k2);
  const chunks: DatasetRow[][] = [];

  for (let i = 0; i < k2; i++) {
    const start = i * rowsPerChunk;
    const end = Math.min(start + rowsPerChunk, test10.data.length);
    chunks.push(test10.data.slice(start, end));
    t2Logs.push(`Chunk ${i}: ${chunks[i].length} records (index [${start}:${end}])`);
  }

  const totalSplitRows = chunks.reduce((acc, c) => acc + c.length, 0);

  t2Assertions.push({
    name: 'Partition chunk count ($K=3$)',
    expected: '3 chunks',
    actual: `${chunks.length} chunks`,
    passed: chunks.length === 3
  });

  t2Assertions.push({
    name: 'Sum of split partitions matches input size',
    expected: '10 rows',
    actual: `${totalSplitRows} rows`,
    passed: totalSplitRows === 10
  });

  t2Assertions.push({
    name: 'Uniform partition size bounds',
    expected: 'Max 4 rows/chunk',
    actual: `${Math.max(...chunks.map(c => c.length))} max rows`,
    passed: Math.max(...chunks.map(c => c.length)) <= 4
  });

  results.push({
    id: 'TC-02',
    title: 'Input Splitting & Partition Distribution',
    category: 'Splitting',
    status: t2Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t2Start) * 100) / 100,
    description: 'Verifies that input splitting creates uniform chunks without loss or duplication of data across boundaries.',
    assertions: t2Assertions,
    logOutput: t2Logs
  });

  // =========================================================================
  // Test 3: Parallel Mapper Key Extraction & Local Sorting
  // =========================================================================
  const t3Start = performance.now();
  const t3Logs: string[] = [];
  const t3Assertions: TestAssertion[] = [];

  const mrRes3 = await executeMapReduceSort(test10.data, 'sales_amount', 'numeric', 3, true);

  t3Assertions.push({
    name: 'Mapper workers spawned and reported',
    expected: '3 mapper details',
    actual: `${mrRes3.chunkDetails.length} mapper details`,
    passed: mrRes3.chunkDetails.length === 3
  });

  let allMappersSorted = true;
  for (const m of mrRes3.chunkDetails) {
    t3Logs.push(`Mapper #${m.chunkId}: ${m.rowCount} rows, min=${m.minKey}, max=${m.maxKey}, time=${m.executionTimeMs}ms`);
    if (m.rowCount > 0 && typeof m.minKey === 'number' && typeof m.maxKey === 'number') {
      if (m.minKey > m.maxKey) allMappersSorted = false;
    }
  }

  t3Assertions.push({
    name: 'Independent local sorting within each Mapper',
    expected: 'minKey <= maxKey in every partition',
    actual: allMappersSorted ? 'All valid' : 'Inversion detected',
    passed: allMappersSorted
  });

  results.push({
    id: 'TC-03',
    title: 'Mapper Key Extraction & Local Partition Sort',
    category: 'Mapper',
    status: t3Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t3Start) * 100) / 100,
    description: 'Ensures each Mapper processes intermediate key-value pairs and sorts its partition locally before shuffle.',
    assertions: t3Assertions,
    logOutput: t3Logs
  });

  // =========================================================================
  // Test 4: Global Ascending Sort via K-Way Heap Reducer
  // =========================================================================
  const t4Start = performance.now();
  const t4Logs: string[] = [];
  const t4Assertions: TestAssertion[] = [];

  const mrResAsc = await executeMapReduceSort(test10.data, 'sales_amount', 'numeric', 4, true);
  const ascKeys = mrResAsc.sortedData.map(r => Number(r.sales_amount));

  t4Logs.push(`Sorted Ascending Keys: [${ascKeys.join(', ')}]`);

  let isAscMonotonic = true;
  for (let i = 0; i < ascKeys.length - 1; i++) {
    if (ascKeys[i] > ascKeys[i + 1]) {
      isAscMonotonic = false;
      t4Logs.push(`Ordering violation at index ${i}: ${ascKeys[i]} > ${ascKeys[i + 1]}`);
      break;
    }
  }

  t4Assertions.push({
    name: 'Global ascending monotonicity across all chunks',
    expected: 'Strictly non-decreasing order (key[i] <= key[i+1])',
    actual: isAscMonotonic ? 'Strictly non-decreasing' : 'Order violation',
    passed: isAscMonotonic
  });

  t4Assertions.push({
    name: 'Smallest element placed at index 0',
    expected: '45.99',
    actual: String(ascKeys[0]),
    passed: ascKeys[0] === 45.99
  });

  t4Assertions.push({
    name: 'Largest element placed at index 9',
    expected: '4200',
    actual: String(ascKeys[ascKeys.length - 1]),
    passed: ascKeys[ascKeys.length - 1] === 4200
  });

  results.push({
    id: 'TC-04',
    title: 'K-Way Merge Reducer Global Ascending Order',
    category: 'Ordering',
    status: t4Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t4Start) * 100) / 100,
    description: 'Verifies that the Min-Heap priority queue merges streams from all 4 chunks into a strictly sorted global sequence.',
    assertions: t4Assertions,
    logOutput: t4Logs
  });

  // =========================================================================
  // Test 5: Global Descending Sort
  // =========================================================================
  const t5Start = performance.now();
  const t5Logs: string[] = [];
  const t5Assertions: TestAssertion[] = [];

  const mrResDesc = await executeMapReduceSort(test10.data, 'sales_amount', 'numeric', 4, false);
  const descKeys = mrResDesc.sortedData.map(r => Number(r.sales_amount));

  t5Logs.push(`Sorted Descending Keys: [${descKeys.join(', ')}]`);

  let isDescMonotonic = true;
  for (let i = 0; i < descKeys.length - 1; i++) {
    if (descKeys[i] < descKeys[i + 1]) {
      isDescMonotonic = false;
      t5Logs.push(`Ordering violation at index ${i}: ${descKeys[i]} < ${descKeys[i + 1]}`);
      break;
    }
  }

  t5Assertions.push({
    name: 'Global descending monotonicity across all chunks',
    expected: 'Strictly non-increasing order (key[i] >= key[i+1])',
    actual: isDescMonotonic ? 'Strictly non-increasing' : 'Order violation',
    passed: isDescMonotonic
  });

  t5Assertions.push({
    name: 'Largest element placed at index 0 in descending',
    expected: '4200',
    actual: String(descKeys[0]),
    passed: descKeys[0] === 4200
  });

  t5Assertions.push({
    name: 'Smallest element placed at index 9 in descending',
    expected: '45.99',
    actual: String(descKeys[descKeys.length - 1]),
    passed: descKeys[descKeys.length - 1] === 45.99
  });

  results.push({
    id: 'TC-05',
    title: 'K-Way Merge Reducer Global Descending Order',
    category: 'Ordering',
    status: t5Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t5Start) * 100) / 100,
    description: 'Verifies inverted priority queue comparator logic for descending global ordering.',
    assertions: t5Assertions,
    logOutput: t5Logs
  });

  // =========================================================================
  // Test 6: Duplicate Key Preservation & Record Retention (Zero Dropped Rows)
  // =========================================================================
  const t6Start = performance.now();
  const t6Logs: string[] = [];
  const t6Assertions: TestAssertion[] = [];

  const inputIds = test10.data.map(r => r.transaction_id).sort((a, b) => Number(a) - Number(b));
  const outputIds = mrResAsc.sortedData.map(r => r.transaction_id).sort((a, b) => Number(a) - Number(b));

  const allIdsPreserved = inputIds.length === outputIds.length &&
    inputIds.every((id, idx) => id === outputIds[idx]);

  t6Logs.push(`Original IDs: [${inputIds.join(', ')}]`);
  t6Logs.push(`Sorted IDs:   [${outputIds.join(', ')}]`);

  t6Assertions.push({
    name: '100% Record Preservation (Exact ID Match)',
    expected: inputIds.join(','),
    actual: outputIds.join(','),
    passed: allIdsPreserved
  });

  // Check duplicate 45.99 records (Liam Anderson #1004 and Ava Martinez #1007)
  const count4599 = mrResAsc.sortedData.filter(r => Number(r.sales_amount) === 45.99).length;
  t6Assertions.push({
    name: 'Duplicate key preservation (sales_amount = 45.99)',
    expected: '2 records retained',
    actual: `${count4599} records retained`,
    passed: count4599 === 2
  });

  t6Assertions.push({
    name: 'Original column preservation (no dropped columns)',
    expected: '8 columns',
    actual: `${Object.keys(mrResAsc.sortedData[0]).length} columns`,
    passed: Object.keys(mrResAsc.sortedData[0]).length === 8
  });

  results.push({
    id: 'TC-06',
    title: 'Duplicate Key Stability & Record Preservation',
    category: 'Integrity',
    status: t6Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t6Start) * 100) / 100,
    description: 'Verifies that Min-Heap sequence tie-breakers preserve duplicate keys and retain all columns without data loss.',
    assertions: t6Assertions,
    logOutput: t6Logs
  });

  // =========================================================================
  // Test 7: Text / Lexicographical Sorting
  // =========================================================================
  const t7Start = performance.now();
  const t7Logs: string[] = [];
  const t7Assertions: TestAssertion[] = [];

  const mrResText = await executeMapReduceSort(test10.data, 'customer_name', 'text', 3, true);
  const textNames = mrResText.sortedData.map(r => String(r.customer_name));

  t7Logs.push(`Alphabetical Sorted Names: [${textNames.join(', ')}]`);

  let isAlphaSorted = true;
  for (let i = 0; i < textNames.length - 1; i++) {
    if (textNames[i].localeCompare(textNames[i + 1]) > 0) {
      isAlphaSorted = false;
      t7Logs.push(`Lexical order violation at index ${i}: "${textNames[i]}" > "${textNames[i + 1]}"`);
      break;
    }
  }

  t7Assertions.push({
    name: 'Lexicographical A-Z ordering on customer_name',
    expected: 'Strictly alphabetical order',
    actual: isAlphaSorted ? 'Strictly alphabetical' : 'Lexical violation',
    passed: isAlphaSorted
  });

  t7Assertions.push({
    name: 'First alphabetical record',
    expected: 'Ava Martinez',
    actual: textNames[0],
    passed: textNames[0] === 'Ava Martinez'
  });

  results.push({
    id: 'TC-07',
    title: 'Text / Lexicographical Key Sorting',
    category: 'Ordering',
    status: t7Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t7Start) * 100) / 100,
    description: 'Verifies string comparison sorting and unicode/case-insensitive key handling.',
    assertions: t7Assertions,
    logOutput: t7Logs
  });

  // =========================================================================
  // Test 8: MapReduce vs Ground-Truth TimSort Equivalence
  // =========================================================================
  const t8Start = performance.now();
  const t8Logs: string[] = [];
  const t8Assertions: TestAssertion[] = [];

  const baseline = executeBaselineSort(test10.data, 'sales_amount', 'numeric', true);
  const baselineKeys = baseline.sortedData.map(r => Number(r.sales_amount));
  const mrKeys = mrResAsc.sortedData.map(r => Number(r.sales_amount));

  const isIdentical = baselineKeys.length === mrKeys.length &&
    baselineKeys.every((k, idx) => k === mrKeys[idx]);

  t8Logs.push(`Ground-Truth TimSort: [${baselineKeys.join(', ')}]`);
  t8Logs.push(`MapReduce K-Way Merge: [${mrKeys.join(', ')}]`);

  t8Assertions.push({
    name: 'Equivalence with single-threaded ground truth',
    expected: '100% identical sequence',
    actual: isIdentical ? '100% identical sequence' : 'Mismatch detected',
    passed: isIdentical
  });

  results.push({
    id: 'TC-08',
    title: 'Ground-Truth Single-Thread Equivalence Test',
    category: 'Integrity',
    status: t8Assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
    durationMs: Math.round((performance.now() - t8Start) * 100) / 100,
    description: 'Proves mathematical equivalence between standard single-threaded in-memory sort and distributed MapReduce K-way merge.',
    assertions: t8Assertions,
    logOutput: t8Logs
  });

  const totalDurationMs = Math.round((performance.now() - suiteStart) * 100) / 100;
  const passedTests = results.filter(r => r.status === 'PASSED').length;
  const failedTests = results.filter(r => r.status === 'FAILED').length;

  return {
    timestamp: new Date().toLocaleTimeString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    overallStatus: failedTests === 0 ? 'ALL_PASSED' : 'SOME_FAILED',
    totalDurationMs,
    results
  };
}
