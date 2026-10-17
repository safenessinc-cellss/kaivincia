import { withTelnyxHandler } from '../_lib/telnyxHandler.js';

// Configuración de Google Sheets (variables de entorno)
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Llamadas!A:Z';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function fetchSheetData() {
  if (!SHEET_ID || !GOOGLE_API_KEY) {
    throw new Error('Faltan GOOGLE_SHEET_ID o GOOGLE_API_KEY');
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Sheets error: ${res.status}`);
  const data = await res.json();
  return data.values || [];
}

async function fetchTelnyxDetailRecords(from: string, to: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error('Falta TELNYX_API_KEY');

  // La API de Detail Records de Telnyx usa filtros de fecha
  const url = `https://api.telnyx.com/v2/detail_records?filter[record_type]=call&filter[date_range][start]=${from}&filter[date_range][end]=${to}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telnyx error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.data || [];
}

export default withTelnyxHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Faltan parámetros from y to (ISO 8601)' }));
    return;
  }

  const [sheetRows, telnyxRecords] = await Promise.all([
    fetchSheetData(),
    fetchTelnyxDetailRecords(from, to),
  ]);

  // Cruzar por número de teléfono (asumiendo que la hoja tiene una columna "telefono")
  const telnyxByNumber = new Map();
  for (const rec of telnyxRecords) {
    const num = rec.to || rec.from;
    if (num) telnyxByNumber.set(num, rec);
  }

  const report = sheetRows.map((row: string[]) => {
    const telefono = row[1]; // ajusta el índice según tu hoja
    const telnyxData = telnyxByNumber.get(telefono) || null;
    return {
      sheet: row,
      telnyx: telnyxData,
      matched: !!telnyxData,
    };
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: true,
    total: report.length,
    matched: report.filter((r: any) => r.matched).length,
    report,
  }));
}, { methods: ['GET'], requireAuth: true });
