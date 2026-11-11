#!/usr/bin/env python3
"""
Hadoop Streaming & Standalone Reducer
=====================================
Module: reducer.py
Description:
    Consumes sorted Intermediate Key-Value pairs from sys.stdin:
        <SortKey>\t<OriginalCSVRow>
    And outputs the globally ordered CSV rows.

    In standard Hadoop architecture:
    1. If mapreduce.job.reduces=1:
       A single Reducer receives all sorted keys from all Mappers.
       Output is globally sorted.
    2. If mapreduce.job.reduces > 1:
       Hadoop's default HashPartitioner routes by hash(key) % num_reducers.
       Each reducer output part-00000, part-00001 is locally sorted,
       BUT NOT globally sorted!
       To achieve global sorting with multiple reducers, Hadoop requires
       org.apache.hadoop.mapreduce.lib.partition.TotalOrderPartitioner
       which samples the dataset using InputSampler to establish non-overlapping
       range partitions (e.g., Reducer 0: A-G, Reducer 1: H-N, Reducer 2: O-Z).

Usage:
    cat sample.csv | python3 mapper.py --col=0 | sort -k1,1 | python3 reducer.py > sorted_sample.csv
"""

import sys


def main():
    header_row = None
    records = []

    for line in sys.stdin:
        line_clean = line.rstrip("\r\n")
        if not line_clean:
            continue

        parts = line_clean.split("\t", 1)
        if len(parts) == 2:
            key, original_row = parts
            if key == "__HEADER__":
                # Emit header at the very top
                if header_row is None:
                    header_row = original_row
                    print(original_row)
            else:
                print(original_row)
        else:
            # Fallback if no tab found
            print(line_clean)


if __name__ == "__main__":
    main()
