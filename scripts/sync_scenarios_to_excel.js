/* eslint-env node */
/**
 * Script: sync_scenarios_to_excel.js
 * Purpose: Keep Excel data (TC_Data) and RunManager.xlsx Regression sheet in sync with feature scenarios.
 *          Ensures no blank rows, adds missing headers, and updates paths & TestCase_ID values.
 *
 * Extended Capabilities:
 *   - Supports multiple feature files passed as arguments.
 *   - Auto-creates additional columns specified via --add-columns
 *   - Allows default values for columns via --default Column=Value (repeatable)
 *   - Maintains continuous row ordering (no gaps) sorted by feature then line number.
 *   - Preserves existing per-scenario data where present (does not overwrite filled cells unless --force-defaults supplied).
 *   - Can restrict updates to only scenarios matching a tag or prefix via --filter "TC-00" (simple substring match).
 *
 * Usage Examples (PowerShell):
 *   # Sync single feature
 *   node .\scripts\sync_scenarios_to_excel.js features/"SauceDemo Login.feature"
 *
 *   # Sync all features in folder
 *   node .\scripts\sync_scenarios_to_excel.js --glob features/*.feature
 *
 *   # Add extra columns and defaults
 *   node .\scripts\sync_scenarios_to_excel.js features/"SauceDemo Login.feature" --add-columns Env,Priority --default Env=QA --default Priority=Medium
 *
 *   # Force overwrite existing values with defaults
 *   node .\scripts\sync_scenarios_to_excel.js features/"SauceDemo Login.feature" --force-defaults --default Screenshot=Yes
 *
 * After running:
 *   node .\runmanager.js
 *   npm run app
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const DATA_FILE = path.resolve('datatables/excel/data.xlsx');
const RUNMANAGER_FILE = path.resolve('RunManager.xlsx');
const TC_DATA_SHEET = 'TC_Data';
const REGRESSION_SHEET = 'Regression';

// Default credential map for SauceDemo login scenarios
const credentialMap = {
  'TC-001_Positive - Standard user login (happy path)': { User_ID: 'standard_user', Password: 'secret_sauce' },
  'TC-002 - Negative - Locked out user': { User_ID: 'locked_out_user', Password: 'secret_sauce' },
  'TC-003 - Negative - Invalid credentials': { User_ID: 'invalid_user', Password: 'bad_password' },
  'TC-004 - Negative - Empty username': { User_ID: '', Password: 'secret_sauce' }
  ,'TC-005 - Negative - Empty password': { User_ID: 'standard_user', Password: '' }
  ,'TC-006 - Edge - SQL/Script injection attempt in username': { User_ID: "'; DROP TABLE users; --", Password: 'secret_sauce' }
  ,'TC-007 - Edge - Excessively long username/password': { User_ID: 'a'.repeat(5000), Password: 'a'.repeat(5000) }
  ,'TC-008 - Usability - Show/hide password toggle (if present)': { User_ID: 'standard_user', Password: 'secret_sauce' }
  // Extend here when new login scenarios are added.
};

function parseArgs(argv) {
  const opts = { features: [], addColumns: [], defaults: {}, glob: null, filter: null, forceDefaults: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--add-columns') {
      const cols = argv[++i];
      if (cols) opts.addColumns.push(...cols.split(/[,;]+/).map(s => s.trim()).filter(Boolean));
    } else if (arg === '--default') {
      const pair = argv[++i];
      if (pair && pair.includes('=')) {
        const [k, v] = pair.split('=');
        opts.defaults[k.trim()] = v.trim();
      }
    } else if (arg === '--glob') {
      opts.glob = argv[++i];
    } else if (arg === '--filter') {
      opts.filter = argv[++i];
    } else if (arg === '--force-defaults') {
      opts.forceDefaults = true;
    } else if (arg.startsWith('--')) {
      console.warn(`Unknown option ignored: ${arg}`);
    } else {
      opts.features.push(arg);
    }
  }
  return opts;
}

function expandGlob(pattern) {
  if (!pattern) return [];
  // Simple glob (only * support) for features directory; fallback: return pattern if exists.
  if (!pattern.includes('*')) return fs.existsSync(pattern) ? [pattern] : [];
  const dir = path.dirname(pattern);
  const base = path.basename(pattern).replace('*', '');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.feature') && f.includes(base))
    .map(f => path.join(dir, f));
}

function parseFeature(featurePath) {
  if (!fs.existsSync(featurePath)) throw new Error(`Feature file not found: ${featurePath}`);
  const lines = fs.readFileSync(featurePath, 'utf-8').split(/\r?\n/);
  const scenarios = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('Scenario:')) {
      const name = trimmed.replace('Scenario:', '').trim();
      scenarios.push({ name, lineNumber: idx + 1 }); // line numbers are 1-based
    }
  });
  return scenarios;
}

async function syncDataSheet(scenarios, options) {
  if (!fs.existsSync(DATA_FILE)) throw new Error(`Missing data file: ${DATA_FILE}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(DATA_FILE);
  const ws = wb.getWorksheet(TC_DATA_SHEET);
  if (!ws) throw new Error(`Worksheet '${TC_DATA_SHEET}' not found.`);

  // Header row for data retrieval is row 2 (project convention)
  const headerRow = ws.getRow(2);
  const headers = {}; // name -> col index
  for (let c = 1; c <= headerRow.cellCount; c++) {
    const v = headerRow.getCell(c).value;
    if (v) headers[v] = c;
  }
  const ensureHeader = (name) => {
    if (!headers[name]) {
      const newCol = headerRow.cellCount + 1;
      headerRow.getCell(newCol).value = name;
      headers[name] = newCol;
    }
  };
  // Mandatory headers
  ['TC_ID', 'User_ID', 'Password', 'Screenshot'].forEach(ensureHeader);
  // Additional requested columns
  options.addColumns.forEach(ensureHeader);
  headerRow.commit();

  // Collect existing scenario rows (scenarioName -> row object) then rebuild compactly starting at row 4
  const existingRows = {};
  for (let r = 4; r <= ws.rowCount; r++) {
    const scenarioName = ws.getRow(r).getCell(2).value;
    if (scenarioName) existingRows[scenarioName] = ws.getRow(r);
  }

  // Determine sequential target row numbers without gaps
  let nextRowNumber = 4;
  for (const sc of scenarios) {
    const scenarioName = sc.name;
    // Either reuse existing row (we will move data if row number differs) or create a new one
    let sourceRow = existingRows[scenarioName];
    let targetRow = ws.getRow(nextRowNumber);
    // Clear target row (basic reset of cells we manage) before writing
    ['TC_ID', 'User_ID', 'Password', 'Screenshot'].forEach(h => {
      if (headers[h]) targetRow.getCell(headers[h]).value = null;
    });
    targetRow.getCell(2).value = scenarioName;
    const creds = credentialMap[scenarioName];
    if (creds) {
      if (headers['User_ID']) {
        const existingVal = sourceRow && sourceRow.getCell(headers['User_ID']).value;
        targetRow.getCell(headers['User_ID']).value = (existingVal && !options.forceDefaults) ? existingVal : creds.User_ID;
      }
      if (headers['Password']) {
        const existingVal = sourceRow && sourceRow.getCell(headers['Password']).value;
        targetRow.getCell(headers['Password']).value = (existingVal && !options.forceDefaults) ? existingVal : creds.Password;
      }
    }
    // Apply defaults (including Screenshot) for any columns specified via --default
    Object.entries(options.defaults).forEach(([col, val]) => {
      if (headers[col]) {
        const existingVal = sourceRow && sourceRow.getCell(headers[col]).value;
        if (options.forceDefaults || !existingVal) targetRow.getCell(headers[col]).value = val;
      }
    });
    if (headers['Screenshot'] && !options.defaults.Screenshot) {
      const existingVal = sourceRow && sourceRow.getCell(headers['Screenshot']).value;
      if (options.forceDefaults || !existingVal) targetRow.getCell(headers['Screenshot']).value = 'Yes';
    }
    targetRow.commit();
    nextRowNumber++;
  }
  // Optionally truncate extraneous rows beyond nextRowNumber-1 (leave as-is to preserve other test cases)
  await wb.xlsx.writeFile(DATA_FILE);
  console.log(`Synced ${scenarios.length} scenario(s) to ${TC_DATA_SHEET} in data.xlsx`);
}

async function syncRunManager(scenarios, featureRelPath) {
  if (!fs.existsSync(RUNMANAGER_FILE)) throw new Error(`Missing RunManager file: ${RUNMANAGER_FILE}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(RUNMANAGER_FILE);
  const ws = wb.getWorksheet(REGRESSION_SHEET);
  if (!ws) throw new Error(`Worksheet '${REGRESSION_SHEET}' not found.`);

  const headerRow = ws.getRow(1);
  // Identify columns
  let executeCol, pathCol = 3; // path convention is column 3
  let testCaseCol = null;
  for (let c = 1; c <= headerRow.cellCount; c++) {
    const v = headerRow.getCell(c).value;
    if (v === 'Execute') executeCol = c;
    if (v === 'TestCase_ID' || v === 'TestCase' || v === 'TC_ID') testCaseCol = c;
  }
  if (!executeCol) throw new Error(`'Execute' column not found in Regression sheet.`);
  if (!testCaseCol) {
    // Add TestCase_ID header at end
    testCaseCol = headerRow.cellCount + 1;
    headerRow.getCell(testCaseCol).value = 'TestCase_ID';
    headerRow.commit();
  } else {
    // Normalize header name to TestCase_ID
    headerRow.getCell(testCaseCol).value = 'TestCase_ID';
    headerRow.commit();
  }

  // Build existing path map
  const existingPathRows = {}; // path -> rowNumber
  for (let r = 2; r <= ws.rowCount; r++) {
    const p = ws.getRow(r).getCell(pathCol).value;
    if (p) existingPathRows[p] = r;
  }

  for (const sc of scenarios) {
    const pathValue = `${featureRelPath}:${sc.lineNumber}`;
    let rowNumber = existingPathRows[pathValue];
    if (!rowNumber) rowNumber = ws.rowCount + 1;
    const row = ws.getRow(rowNumber);
    row.getCell(executeCol).value = 'Yes';
    row.getCell(pathCol).value = pathValue;
  row.getCell(testCaseCol).value = sc.name;
    row.commit();
  }
  await wb.xlsx.writeFile(RUNMANAGER_FILE);
  console.log(`Synced ${scenarios.length} scenario path(s) to RunManager.xlsx (${REGRESSION_SHEET})`);
}

/* global process */
async function main() {
  try {
    const options = parseArgs(process.argv);
    let featureFiles = [...options.features];
    if (options.glob) featureFiles.push(...expandGlob(options.glob));
    if (featureFiles.length === 0) featureFiles = ['features/SauceDemo Login.feature'];

    // Aggregate scenarios with feature path & line numbers
    const aggregated = [];
    for (const f of featureFiles) {
      const rel = f.replace(/\\/g, '/');
      const abs = path.resolve(rel);
      const scenarios = parseFeature(abs).map(s => ({ ...s, featureRelPath: rel }));
      aggregated.push(...scenarios);
    }
    let filtered = aggregated;
    if (options.filter) filtered = aggregated.filter(s => s.name.includes(options.filter));
    if (!filtered.length) {
      console.warn('No matching scenarios found; nothing to sync.');
      return;
    }
    // Stable ordering by feature then lineNumber
    filtered.sort((a, b) => a.featureRelPath.localeCompare(b.featureRelPath) || a.lineNumber - b.lineNumber);
    await syncDataSheet(filtered.map(s => ({ name: s.name })), options);
    // Group by feature for RunManager paths
    const grouped = filtered.reduce((acc, s) => { (acc[s.featureRelPath] = acc[s.featureRelPath] || []).push(s); return acc; }, {});
    for (const [featurePath, scs] of Object.entries(grouped)) {
      await syncRunManager(scs.map(s => ({ name: s.name, lineNumber: s.lineNumber })), featurePath);
    }
    console.log('--- Sync complete. Run "node runmanager.js" then "npm run app" to execute. ---');
  } catch (e) {
    console.error('Sync failed:', e.message || e);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };