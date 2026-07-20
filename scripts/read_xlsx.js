const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('d:\\Project\\Second Brain R&D Marketing v3\\Kalodata_Product manual clean v3.xlsx');
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet Name:', sheetName);
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('Total Rows:', rows.length);
  console.log('First 5 rows:');
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    console.log(`Row ${i}:`, rows[i]);
  }
} catch (e) {
  console.error('Error reading file:', e);
}
