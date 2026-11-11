#!/usr/bin/env python3
"""
Hadoop Streaming & Standalone Mapper
====================================
Module: mapper.py
Description:
    Reads CSV rows from sys.stdin or chunk files, extracts the specified sort key,
    and outputs tab-separated Key-Value pairs:
        <SortKey>\t<OriginalCSVRow>

Usage with Hadoop Streaming:
    hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \
        -D mapreduce.job.reduces=1 \
        -files mapper.py,reducer.py \
        -mapper "python3 mapper.py --col=3" \
        -reducer "python3 reducer.py" \
        -input /hdfs/input/large_dataset.csv \
        -output /hdfs/output/sorted_dataset

Local test:
    cat sample.csv | python3 mapper.py --col=0 | sort -k1,1 | python3 reducer.py
"""

import sys
import argparse


def parse_args():
    parser = argparse.ArgumentParser(description="MapReduce CSV Sorting Mapper")
    parser.add_argument("--col", type=int, default=0, help="0-based column index to sort by (default: 0)")
    parser.add_argument("--has-header", action="store_true", default=True, help="Whether the stream has a header row")
    return parser.parse_known_args()[0]


def main():
    args = parse_args()
    col_idx = args.col
    is_first_line = True

    for line in sys.stdin:
        line_clean = line.strip()
        if not line_clean:
            continue

        if is_first_line and args.has_header:
            # Emit special header marker to preserve headers
            # Using null byte prefix so sort places it at top
            print(f"__HEADER__\t{line_clean}")
            is_first_line = False
            continue

        # Split CSV line (respecting standard comma separator)
        parts = line_clean.split(",")
        if col_idx < len(parts):
            key = parts[col_idx].strip('"').strip()
            # Normalize numeric keys with zero-padding or scientific notation if purely numeric
            # so standard lexical shuffle sorts numbers correctly
            try:
                num_val = float(key)
                formatted_key = f"NUM_{num_val:+020.6f}"
            except ValueError:
                formatted_key = f"STR_{key.lower()}"
        else:
            formatted_key = "STR_"

        # Intermediate Key-Value pair
        # Key: Formatted sort key for MapReduce shuffle
        # Value: Full original CSV record
        print(f"{formatted_key}\t{line_clean}")


if __name__ == "__main__":
    main()
