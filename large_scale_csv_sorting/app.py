"""
Large-Scale CSV Sorting Using MapReduce
=======================================
Module: app.py
Description:
    Flask Web Application for Large-Scale CSV Sorting using MapReduce.
    Provides web routes for uploading CSVs, configuring MapReduce parameters,
    visualizing the 4 MapReduce stages, inspecting sorted results, and running
    performance comparisons.
"""

import os
import time
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, send_file, flash, jsonify
from werkzeug.utils import secure_filename

from sorting_engine import MapReduceCSVSorter, benchmark_single_thread
from performance import run_benchmark_suite

app = Flask(__name__)
app.secret_key = "mapreduce_sorting_academic_secret_key"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
STATIC_IMG_FOLDER = os.path.join(BASE_DIR, "static", "images")
SAMPLE_DATA_FOLDER = os.path.join(BASE_DIR, "sample_data")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(STATIC_IMG_FOLDER, exist_ok=True)
os.makedirs(SAMPLE_DATA_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB max file size
ALLOWED_EXTENSIONS = {"csv"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_csv_metadata(file_path):
    """Safely extracts CSV header, row count, file size, and preview rows without memory overflow."""
    file_size_bytes = os.path.getsize(file_path)
    file_size_formatted = f"{file_size_bytes / (1024 * 1024):.2f} MB" if file_size_bytes >= 1024 * 1024 else f"{file_size_bytes / 1024:.1f} KB"

    # Read preview (first 10 records)
    preview_df = pd.read_csv(file_path, nrows=10)
    columns = list(preview_df.columns)

    # Count total rows safely
    total_rows = 0
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        f.readline()  # header
        for _ in f:
            total_rows += 1

    # Infer column data types
    col_types = {}
    for col in columns:
        col_type = "Text"
        sample = preview_df[col].dropna()
        if not sample.empty:
            try:
                pd.to_numeric(sample)
                col_type = "Numeric"
            except (ValueError, TypeError):
                try:
                    pd.to_datetime(sample)
                    col_type = "DateTime"
                except Exception:
                    col_type = "Text"
        col_types[col] = col_type

    return {
        "columns": columns,
        "col_types": col_types,
        "total_rows": total_rows,
        "file_size": file_size_formatted,
        "preview_data": preview_df.to_dict(orient="records")
    }


@app.route("/")
def index():
    """Module 1: Home Dashboard"""
    # Check for available pre-packaged sample files
    sample_files = []
    if os.path.exists(SAMPLE_DATA_FOLDER):
        for f in sorted(os.listdir(SAMPLE_DATA_FOLDER)):
            if f.endswith(".csv"):
                fp = os.path.join(SAMPLE_DATA_FOLDER, f)
                size_kb = os.path.getsize(fp) / 1024
                sample_files.append({"filename": f, "size_kb": f"{size_kb:.1f} KB"})

    return render_template("index.html", sample_files=sample_files)


@app.route("/upload", methods=["POST"])
def upload_file():
    """Module 2: CSV File Upload & Validation"""
    # Option A: User uploaded file
    if "csv_file" in request.files and request.files["csv_file"].filename != "":
        file = request.files["csv_file"]
        if not allowed_file(file.filename):
            flash("Invalid file format. Please upload a standard .csv file.", "error")
            return redirect(url_for("index"))

        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
    # Option B: User picked sample dataset
    elif "sample_dataset" in request.form and request.form["sample_dataset"]:
        sample_name = request.form["sample_dataset"]
        src_path = os.path.join(SAMPLE_DATA_FOLDER, sample_name)
        if not os.path.exists(src_path):
            flash(f"Sample dataset {sample_name} not found.", "error")
            return redirect(url_for("index"))
        filename = f"sample_{sample_name}"
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        # Copy to uploads
        import shutil
        shutil.copyfile(src_path, save_path)
    else:
        flash("No file was uploaded or selected.", "error")
        return redirect(url_for("index"))

    # Validate file content
    try:
        meta = get_csv_metadata(save_path)
        if meta["total_rows"] == 0:
            os.remove(save_path)
            flash("The uploaded CSV has no data rows.", "error")
            return redirect(url_for("index"))
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        flash(f"Error reading CSV structure: {str(e)}", "error")
        return redirect(url_for("index"))

    return redirect(url_for("configure", filename=filename))


@app.route("/configure/<filename>")
def configure(filename):
    """Module 3: Sorting Configuration"""
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not os.path.exists(file_path):
        flash("File session expired or missing.", "error")
        return redirect(url_for("index"))

    try:
        meta = get_csv_metadata(file_path)
    except Exception as e:
        flash(f"Error inspecting CSV: {str(e)}", "error")
        return redirect(url_for("index"))

    return render_template(
        "dashboard.html",
        filename=filename,
        meta=meta
    )


@app.route("/execute_sort", methods=["POST"])
def execute_sort():
    """Module 4: MapReduce Execution"""
    filename = request.form.get("filename")
    sort_column = request.form.get("sort_column")
    sort_order = request.form.get("sort_order", "asc")
    num_chunks = int(request.form.get("num_chunks", 4))
    ascending = (sort_order == "asc")

    input_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not os.path.exists(input_path):
        flash("Dataset file not found.", "error")
        return redirect(url_for("index"))

    out_filename = f"sorted_{filename}"
    output_path = os.path.join(app.config["OUTPUT_FOLDER"], out_filename)

    sorter = MapReduceCSVSorter(num_chunks=num_chunks)
    try:
        res = sorter.execute_sort(input_path, output_path, sort_column, ascending=ascending)
    except Exception as e:
        flash(f"MapReduce Execution Failed: {str(e)}", "error")
        return redirect(url_for("configure", filename=filename))

    # Read preview of sorted dataset
    sorted_meta = get_csv_metadata(output_path)
    orig_meta = get_csv_metadata(input_path)

    # Verification checks
    is_verified = (orig_meta["total_rows"] == sorted_meta["total_rows"])

    return render_template(
        "results.html",
        filename=filename,
        out_filename=out_filename,
        sort_column=sort_column,
        sort_order=sort_order,
        num_chunks=num_chunks,
        timings=res["timings"],
        mapper_details=res["mapper_details"],
        orig_meta=orig_meta,
        sorted_meta=sorted_meta,
        is_verified=is_verified
    )


@app.route("/download/<filename>")
def download_file(filename):
    """Module 5: Download Sorted CSV"""
    out_path = os.path.join(app.config["OUTPUT_FOLDER"], filename)
    if not os.path.exists(out_path):
        flash("Requested output file does not exist.", "error")
        return redirect(url_for("index"))
    return send_file(out_path, as_attachment=True, download_name=filename)


@app.route("/performance/<filename>", methods=["GET", "POST"])
def performance_analysis(filename):
    """Module 6: Performance Analysis & Benchmarking"""
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not os.path.exists(file_path):
        flash("Dataset not found for performance test.", "error")
        return redirect(url_for("index"))

    meta = get_csv_metadata(file_path)
    sort_column = request.args.get("col", meta["columns"][0])

    chart_img_rel = f"images/perf_{filename.replace('.', '_')}.png"
    chart_img_abs = os.path.join(STATIC_IMG_FOLDER, f"perf_{filename.replace('.', '_')}.png")

    # Run benchmark suite and generate Matplotlib chart
    bench_data = run_benchmark_suite(file_path, sort_column, chart_img_abs)

    return render_template(
        "dashboard.html",
        filename=filename,
        meta=meta,
        bench_data=bench_data,
        chart_img=chart_img_rel,
        show_perf=True
    )


if __name__ == "__main__":
    print("Starting Flask MapReduce CSV Sorting Application on port 5000...")
    print("Open http://127.0.0.1:5000 in your browser.")
    app.run(host="0.0.0.0", port=5000, debug=True)
