"""
Sample Dataset Generator for Large-Scale CSV Sorting
====================================================
Generates standard benchmark datasets:
- 1,000 records (~100 KB)
- 10,000 records (~1 MB)
- 100,000 records (~10 MB)
"""

import os
import random
import csv
from datetime import datetime, timedelta

FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Sophia", "Ethan", "Isabella", "Mason", "Mia", "Oliver", "Amelia", "Aiden", "Harper"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson"]
CATEGORIES = ["Electronics", "Appliances", "Furniture", "Books", "Clothing", "Industrial", "Health & Personal Care", "Automotive", "Garden"]
CITIES = ["New York", "San Francisco", "Austin", "Chicago", "Seattle", "Boston", "Denver", "Atlanta", "Dallas", "Miami", "San Diego"]


def generate_csv(file_path: str, row_count: int):
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    start_date = datetime(2023, 1, 1)

    print(f"Generating {row_count:,} records into {file_path}...")
    headers = [
        "transaction_id",
        "customer_name",
        "category",
        "sales_amount",
        "quantity",
        "discount",
        "transaction_date",
        "city"
    ]

    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for i in range(1, row_count + 1):
            cust = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            cat = random.choice(CATEGORIES)
            # Deliberately varied float with 2 decimals
            amount = round(random.uniform(5.0, 5000.0), 2)
            qty = random.randint(1, 20)
            discount = round(random.uniform(0.0, 0.35), 2)
            d = start_date + timedelta(days=random.randint(0, 1000))
            date_str = d.strftime("%Y-%m-%d")
            city = random.choice(CITIES)

            writer.writerow([
                10000000 + i,
                cust,
                cat,
                amount,
                qty,
                discount,
                date_str,
                city
            ])

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"Finished {file_path} ({size_mb:.2f} MB)")


def write_sample_10(file_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    rows = [
        ["transaction_id", "customer_name", "category", "sales_amount", "quantity", "discount", "transaction_date", "city"],
        [1001, "Sophia Taylor", "Electronics", 850.50, 3, 0.10, "2023-04-12", "Seattle"],
        [1002, "Lucas Wilson", "Furniture", 120.00, 1, 0.05, "2023-08-19", "Austin"],
        [1003, "Olivia Smith", "Appliances", 4200.00, 10, 0.20, "2023-01-05", "New York"],
        [1004, "Liam Anderson", "Books", 45.99, 2, 0.00, "2023-11-23", "Chicago"],
        [1005, "Emma Johnson", "Clothing", 1200.00, 4, 0.15, "2023-06-30", "Boston"],
        [1006, "Noah Davis", "Industrial", 310.25, 1, 0.00, "2023-03-14", "Denver"],
        [1007, "Ava Martinez", "Health & Care", 45.99, 2, 0.05, "2023-09-02", "Miami"],
        [1008, "Oliver Brown", "Automotive", 2899.00, 5, 0.25, "2023-12-01", "San Francisco"],
        [1009, "Mia Garcia", "Garden", 750.00, 3, 0.10, "2023-07-08", "Atlanta"],
        [1010, "Ethan Miller", "Sports", 150.00, 2, 0.05, "2023-02-28", "Portland"]
    ]
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Generated 10-record test dataset at {file_path}")


if __name__ == "__main__":
    write_sample_10("sample_data/sample_10.csv")
    generate_csv("sample_data/sample_1000.csv", 1000)
    generate_csv("sample_data/sample_10000.csv", 10000)
    print("Pre-generated 10, 1,000, and 10,000 datasets.")
    print("Run `python test_sorting.py` to execute automated functional tests.")

