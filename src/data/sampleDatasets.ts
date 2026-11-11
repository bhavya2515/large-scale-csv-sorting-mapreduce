import { Dataset, DatasetRow, ColumnMeta } from '../types';
import { inferColumnType } from '../engine/mapReduceEngine';

const FIRST_NAMES = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Sophia", "Ethan", "Isabella", "Mason", "Mia", "Oliver", "Amelia", "Aiden", "Harper", "Benjamin", "Charlotte", "Elijah", "Evelyn"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const CATEGORIES = ["Electronics", "Appliances", "Furniture", "Books", "Clothing", "Industrial", "Health & Care", "Automotive", "Garden", "Sports"];
const CITIES = ["New York", "San Francisco", "Austin", "Chicago", "Seattle", "Boston", "Denver", "Atlanta", "Dallas", "Miami", "San Diego", "Portland"];

export function generateSalesDataset(count: number, name: string = 'Retail Sales Records'): Dataset {
  const data: DatasetRow[] = [];
  const baseDate = new Date(2023, 0, 1).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i <= count; i++) {
    const cust = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;
    const cat = CATEGORIES[(i * 7) % CATEGORIES.length];
    // Deterministic pseudo-randomness for repeatable benchmark consistency
    const amount = Math.round((((i * 9301 + 49297) % 233280) / 233280 * 4990 + 10) * 100) / 100;
    const qty = (i % 15) + 1;
    const discount = Math.round(((i % 7) * 0.05) * 100) / 100;
    const dateObj = new Date(baseDate + (i % 800) * dayMs);
    const dateStr = dateObj.toISOString().split('T')[0];
    const city = CITIES[(i * 5) % CITIES.length];

    data.push({
      transaction_id: 10000000 + i,
      customer_name: cust,
      category: cat,
      sales_amount: amount,
      quantity: qty,
      discount,
      transaction_date: dateStr,
      city
    });
  }

  const columns: ColumnMeta[] = [
    { name: 'transaction_id', type: 'numeric', sample: data[0].transaction_id },
    { name: 'customer_name', type: 'text', sample: data[0].customer_name },
    { name: 'category', type: 'text', sample: data[0].category },
    { name: 'sales_amount', type: 'numeric', sample: data[0].sales_amount },
    { name: 'quantity', type: 'numeric', sample: data[0].quantity },
    { name: 'discount', type: 'numeric', sample: data[0].discount },
    { name: 'transaction_date', type: 'datetime', sample: data[0].transaction_date },
    { name: 'city', type: 'text', sample: data[0].city }
  ];

  const estimatedBytes = count * 95;
  const fileSizeFormatted = estimatedBytes >= 1024 * 1024
    ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(estimatedBytes / 1024).toFixed(1)} KB`;

  return {
    id: `sales_${count}`,
    name: `${name} (${count.toLocaleString()} rows)`,
    rowCount: count,
    columns,
    data,
    fileSizeFormatted
  };
}

export function generate10RecordTestDataset(): Dataset {
  const data: DatasetRow[] = [
    { transaction_id: 1001, customer_name: "Sophia Taylor", category: "Electronics", sales_amount: 850.50, quantity: 3, discount: 0.10, transaction_date: "2023-04-12", city: "Seattle" },
    { transaction_id: 1002, customer_name: "Lucas Wilson", category: "Furniture", sales_amount: 120.00, quantity: 1, discount: 0.05, transaction_date: "2023-08-19", city: "Austin" },
    { transaction_id: 1003, customer_name: "Olivia Smith", category: "Appliances", sales_amount: 4200.00, quantity: 10, discount: 0.20, transaction_date: "2023-01-05", city: "New York" },
    { transaction_id: 1004, customer_name: "Liam Anderson", category: "Books", sales_amount: 45.99, quantity: 2, discount: 0.00, transaction_date: "2023-11-23", city: "Chicago" },
    { transaction_id: 1005, customer_name: "Emma Johnson", category: "Clothing", sales_amount: 1200.00, quantity: 4, discount: 0.15, transaction_date: "2023-06-30", city: "Boston" },
    { transaction_id: 1006, customer_name: "Noah Davis", category: "Industrial", sales_amount: 310.25, quantity: 1, discount: 0.00, transaction_date: "2023-03-14", city: "Denver" },
    { transaction_id: 1007, customer_name: "Ava Martinez", category: "Health & Care", sales_amount: 45.99, quantity: 2, discount: 0.05, transaction_date: "2023-09-02", city: "Miami" },
    { transaction_id: 1008, customer_name: "Oliver Brown", category: "Automotive", sales_amount: 2899.00, quantity: 5, discount: 0.25, transaction_date: "2023-12-01", city: "San Francisco" },
    { transaction_id: 1009, customer_name: "Mia Garcia", category: "Garden", sales_amount: 750.00, quantity: 3, discount: 0.10, transaction_date: "2023-07-08", city: "Atlanta" },
    { transaction_id: 1010, customer_name: "Ethan Miller", category: "Sports", sales_amount: 150.00, quantity: 2, discount: 0.05, transaction_date: "2023-02-28", city: "Portland" }
  ];

  const columns: ColumnMeta[] = [
    { name: 'transaction_id', type: 'numeric', sample: 1001 },
    { name: 'customer_name', type: 'text', sample: "Sophia Taylor" },
    { name: 'category', type: 'text', sample: "Electronics" },
    { name: 'sales_amount', type: 'numeric', sample: 850.50 },
    { name: 'quantity', type: 'numeric', sample: 3 },
    { name: 'discount', type: 'numeric', sample: 0.10 },
    { name: 'transaction_date', type: 'datetime', sample: "2023-04-12" },
    { name: 'city', type: 'text', sample: "Seattle" }
  ];

  return {
    id: 'test_10',
    name: '10-Record Functional Test Dataset',
    rowCount: 10,
    columns,
    data,
    fileSizeFormatted: '0.8 KB'
  };
}

export function generateSensorDataset(count: number): Dataset {
  const data: DatasetRow[] = [];
  const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (let i = 1; i <= count; i++) {
    const sensorId = `SENS-${100 + (i % 20)}`;
    const temp = Math.round((20 + (i % 35) + Math.sin(i) * 5) * 10) / 10;
    const humidity = Math.round((45 + (i % 40) + Math.cos(i) * 10) * 10) / 10;
    const pressure = Math.round((1013 + ((i * 17) % 50) - 25) * 10) / 10;
    const status = (i % 23 === 0) ? 'ALERT' : (i % 11 === 0 ? 'WARN' : 'NOMINAL');
    const timestamp = new Date(baseTime + i * 60000).toISOString();

    data.push({
      reading_id: 500000 + i,
      sensor_id: sensorId,
      temperature_c: temp,
      humidity_pct: humidity,
      pressure_hpa: pressure,
      status,
      timestamp
    });
  }

  const columns: ColumnMeta[] = [
    { name: 'reading_id', type: 'numeric', sample: data[0].reading_id },
    { name: 'sensor_id', type: 'text', sample: data[0].sensor_id },
    { name: 'temperature_c', type: 'numeric', sample: data[0].temperature_c },
    { name: 'humidity_pct', type: 'numeric', sample: data[0].humidity_pct },
    { name: 'pressure_hpa', type: 'numeric', sample: data[0].pressure_hpa },
    { name: 'status', type: 'text', sample: data[0].status },
    { name: 'timestamp', type: 'datetime', sample: data[0].timestamp }
  ];

  const estimatedBytes = count * 90;
  const fileSizeFormatted = estimatedBytes >= 1024 * 1024
    ? `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(estimatedBytes / 1024).toFixed(1)} KB`;

  return {
    id: `sensor_${count}`,
    name: `IoT Industrial Sensor Telemetry (${count.toLocaleString()} rows)`,
    rowCount: count,
    columns,
    data,
    fileSizeFormatted
  };
}

export function parseUploadedCSV(filename: string, text: string): Dataset {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV file must contain a header and at least one data record.");
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const data: DatasetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawParts = lines[i].split(',');
    const row: DatasetRow = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      const rawVal = rawParts[c] !== undefined ? rawParts[c].trim().replace(/^["']|["']$/g, '') : '';
      const num = Number(rawVal);
      if (!isNaN(num) && rawVal !== '') {
        row[colName] = num;
      } else {
        row[colName] = rawVal;
      }
    }
    data.push(row);
  }

  const columns: ColumnMeta[] = headers.map(colName => {
    const samples = data.slice(0, 30).map(r => r[colName]);
    const type = inferColumnType(samples);
    return {
      name: colName,
      type,
      sample: data[0]?.[colName] ?? ''
    };
  });

  const bytes = text.length;
  const fileSizeFormatted = bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

  return {
    id: `custom_${Date.now()}`,
    name: filename,
    rowCount: data.length,
    columns,
    data,
    fileSizeFormatted,
    isCustomUpload: true
  };
}
