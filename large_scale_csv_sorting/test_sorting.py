"""
Automated Functional Verification Suite for MapReduce CSV Sorting
================================================================
Module: test_sorting.py
Description:
    Performs automated functional testing of:
    1. Input splitting into chunks
    2. Mapper local partition sorting
    3. K-Way Heap Reducer global ordering
    4. Ascending and descending verification
    5. Duplicate record retention (stability)
    6. Ground-truth equivalence against standard sort
"""

import os
import sys
import csv
from sorting_engine import MapReduceCSVSorter, infer_type_and_cast

def run_tests():
    print("=" * 70)
    print("  RUNNING AUTOMATED FUNCTIONAL VERIFICATION SUITE (10-RECORD TEST BED)")
    print("=" * 70)

    sample_10_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_10.csv")
    if not os.path.exists(sample_10_path):
        print(f"[FAIL] Test sample file {sample_10_path} not found.")
        sys.exit(1)

    # Read original 10 rows
    original_rows = []
    with open(sample_10_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for r in reader:
            if r:
                original_rows.append(r)

    assert len(original_rows) == 10, f"Expected 10 rows, got {len(original_rows)}"
    sales_idx = header.index("sales_amount")
    id_idx = header.index("transaction_id")
    print(f"[PASS] Ingested 10 rows with {len(header)} columns.")

    # -------------------------------------------------------------
    # Test 1: Input Splitting (3 Chunks)
    # -------------------------------------------------------------
    sorter = MapReduceCSVSorter(num_chunks=3)
    temp_dir = os.path.join(os.path.dirname(__file__), "outputs", "test_temp")
    chunks = sorter.split_csv(sample_10_path, temp_dir)
    assert len(chunks) == 3, f"Expected 3 chunks, got {len(chunks)}"

    total_chunk_rows = 0
    for cp in chunks:
        with open(cp, 'r') as cf:
            c_header = cf.readline()
            assert c_header.strip() == ",".join(header), "Header not preserved in chunk"
            rows = cf.readlines()
            total_chunk_rows += len(rows)
    assert total_chunk_rows == 10, f"Expected 10 total split rows, got {total_chunk_rows}"
    print("[PASS] Test 1: Input Splitting verified (3 chunks, headers preserved, 10 rows).")

    # -------------------------------------------------------------
    # Test 2: Global Ascending Sort via K-Way Merge Reducer
    # -------------------------------------------------------------
    asc_output = os.path.join(os.path.dirname(__file__), "outputs", "test_asc_10.csv")
    res_asc = sorter.execute_sort(sample_10_path, asc_output, "sales_amount", ascending=True)

    sorted_asc_rows = []
    with open(asc_output, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        out_header = next(reader)
        for r in reader:
            if r:
                sorted_asc_rows.append(r)

    assert len(sorted_asc_rows) == 10, f"Expected 10 sorted rows, got {len(sorted_asc_rows)}"

    asc_amounts = [float(r[sales_idx]) for r in sorted_asc_rows]
    for i in range(len(asc_amounts) - 1):
        assert asc_amounts[i] <= asc_amounts[i+1], f"Ascending order violation: {asc_amounts[i]} > {asc_amounts[i+1]}"

    assert asc_amounts[0] == 45.99, f"Expected minimum 45.99, got {asc_amounts[0]}"
    assert asc_amounts[-1] == 4200.0, f"Expected maximum 4200.0, got {asc_amounts[-1]}"
    print(f"[PASS] Test 2: Global Ascending Sort verified (Keys: {asc_amounts}).")

    # -------------------------------------------------------------
    # Test 3: Global Descending Sort
    # -------------------------------------------------------------
    desc_output = os.path.join(os.path.dirname(__file__), "outputs", "test_desc_10.csv")
    res_desc = sorter.execute_sort(sample_10_path, desc_output, "sales_amount", ascending=False)

    sorted_desc_rows = []
    with open(desc_output, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        out_header = next(reader)
        for r in reader:
            if r:
                sorted_desc_rows.append(r)

    desc_amounts = [float(r[sales_idx]) for r in sorted_desc_rows]
    for i in range(len(desc_amounts) - 1):
        assert desc_amounts[i] >= desc_amounts[i+1], f"Descending order violation: {desc_amounts[i]} < {desc_amounts[i+1]}"

    assert desc_amounts[0] == 4200.0, f"Expected maximum first in descending, got {desc_amounts[0]}"
    assert desc_amounts[-1] == 45.99, f"Expected minimum last in descending, got {desc_amounts[-1]}"
    print(f"[PASS] Test 3: Global Descending Sort verified (Keys: {desc_amounts}).")

    # -------------------------------------------------------------
    # Test 4: Duplicate Record Retention (Stability Check)
    # -------------------------------------------------------------
    orig_ids = sorted([int(r[id_idx]) for r in original_rows])
    asc_ids = sorted([int(r[id_idx]) for r in sorted_asc_rows])
    assert orig_ids == asc_ids, "Record loss or corruption detected: IDs do not match!"

    dup_count = sum(1 for r in sorted_asc_rows if float(r[sales_idx]) == 45.99)
    assert dup_count == 2, f"Expected 2 duplicate keys (45.99), got {dup_count}"
    print("[PASS] Test 4: Duplicate Keys (45.99) preserved without dropping or overwriting records.")

    # -------------------------------------------------------------
    # Test 5: Ground-Truth Single-Thread Equivalence
    # -------------------------------------------------------------
    ground_truth = sorted(original_rows, key=lambda r: infer_type_and_cast(r[sales_idx]))
    gt_amounts = [float(r[sales_idx]) for r in ground_truth]
    assert asc_amounts == gt_amounts, "MapReduce output does not match single-thread ground truth"
    print("[PASS] Test 5: Mathematical equivalence with ground-truth single-threaded sort verified.")

    # Cleanup test files
    if os.path.exists(asc_output):
        os.remove(asc_output)
    if os.path.exists(desc_output):
        os.remove(desc_output)

    print("=" * 70)
    print("  ALL 5 FUNCTIONAL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
