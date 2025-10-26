const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.read(require('fs').readFileSync('Oct9_schedule.xlsx'));
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log('=== EXCEL FILE ANALYSIS ===');
console.log('Sheet Names:', workbook.SheetNames);
console.log('\n=== FIRST 20 ROWS (RAW) ===');

// Convert to JSON to see the structure
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Show first 20 rows
for (let i = 0; i < Math.min(20, data.length); i++) {
  const row = data[i] || [];
  console.log(`Row ${i}:`, row.slice(0, 15)); // First 15 columns
}

console.log('\n=== COLUMN HEADERS ANALYSIS ===');
// Find potential header rows
for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i] || [];
  const hasLineColumn = row.some(cell => String(cell || '').toLowerCase().includes('line'));
  const hasDayColumns = row.some(cell => String(cell || '').toLowerCase().includes('day'));
  const hasOperationColumn = row.some(cell => String(cell || '').toLowerCase().includes('operation'));
  
  if (hasLineColumn || hasDayColumns || hasOperationColumn) {
    console.log(`\nPotential header row ${i}:`, row.slice(0, 20));
    console.log(`  - Has LINE: ${hasLineColumn}`);
    console.log(`  - Has DAY: ${hasDayColumns}`);
    console.log(`  - Has OPERATION: ${hasOperationColumn}`);
  }
}

console.log('\n=== SAMPLE DATA ROWS ===');
// Look for actual data rows (non-empty first few columns)
let dataRowsFound = 0;
for (let i = 0; i < data.length && dataRowsFound < 10; i++) {
  const row = data[i] || [];
  if (row[0] && String(row[0]).trim() && !String(row[0]).toLowerCase().includes('line')) {
    console.log(`Data row ${i}:`, row.slice(0, 10));
    dataRowsFound++;
  }
}

console.log('\n=== COLUMN STRUCTURE ANALYSIS ===');
// Analyze column 0 (likely line numbers)
const col0Values = data.slice(0, 50).map(row => row[0]).filter(val => val).slice(0, 20);
console.log('Column 0 sample values:', col0Values);

// Look for DAY_ columns
const sampleRow = data[5] || data[4] || data[3] || data[2] || data[1] || data[0] || [];
const dayColumns = Object.keys(sampleRow).filter((key, index) => {
  const header = String(sampleRow[index] || '').toLowerCase();
  return header.includes('day');
});
console.log('DAY columns found in sample row:', dayColumns.length);

// Look for all unique values in first few columns to understand structure
for (let col = 0; col < 5; col++) {
  const colValues = data.slice(0, 100).map(row => row[col]).filter(val => val && String(val).trim());
  const uniqueValues = [...new Set(colValues.slice(0, 20))];
  console.log(`\nColumn ${col} sample unique values:`, uniqueValues);
}

console.log('\n=== ALL UNIQUE GROUP VALUES ===');
// Get all unique GROUP (column 1) values from entire file
const allGroupValues = data.slice(1) // Skip header row
  .map(row => row[1])
  .filter(val => val && String(val).trim() && val !== 'GROUP')
  .map(val => String(val).trim());
const uniqueGroups = [...new Set(allGroupValues)];
console.log(`Found ${uniqueGroups.length} unique GROUP values:`, uniqueGroups);

// Count how many lines each group has
const groupCounts = {};
allGroupValues.forEach(group => {
  groupCounts[group] = (groupCounts[group] || 0) + 1;
});
console.log('\nLines per GROUP:');
Object.entries(groupCounts).forEach(([group, count]) => {
  console.log(`  ${group}: ${count} lines`);
});