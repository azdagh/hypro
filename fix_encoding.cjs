const fs = require('fs');
const path = require('path');

const files = [
  'ExpensesView','ProcurementView','ReportsView','DashboardView',
  'AdministrationView','InventoryView','ProjectsView','SettingsView'
];

// Mojibake fix pairs: each bad multi-byte sequence -> correct char
const fixes = [
  ['\u00c3\u00a9', 'é'], ['\u00c3\u00a8', 'è'], ['\u00c3\u00aa', 'ê'],
  ['\u00c3\u00ab', 'ë'], ['\u00c3\u00a0', 'à'], ['\u00c3\u00a2', 'â'],
  ['\u00c3\u00a4', 'ä'], ['\u00c3\u00b4', 'ô'], ['\u00c3\u00b9', 'ù'],
  ['\u00c3\u00bb', 'û'], ['\u00c3\u00bc', 'ü'], ['\u00c3\u00a7', 'ç'],
  ['\u00c3\u00af', 'ï'], ['\u00c3\u00ae', 'î'], ['\u00c3\u0089', 'É'],
  ['\u00c3\u0088', 'È'], ['\u00c3\u0080', 'À'], ['\u00c3\u0087', 'Ç'],
  ['\u00c3\u008e', 'Î'], ['\u00c3\u0094', 'Ô'], ['\u00c3\u0099', 'Ù'],
  ['\u00c3\u009b', 'Û'], ['\u00c3\u009c', 'Ü'], ['\u00c3\u009f', 'ß'],
  ['\u00c3\u00b3', 'ó'], ['\u00c3\u00ba', 'ú'], ['\u00c3\u00b1', 'ñ'],
  ['\u00c3\u00b6', 'ö'], ['\u00c3\u00b8', 'ø'],
  ['\u00c2\u00b0', '°'], ['\u00c2\u00ab', '«'], ['\u00c2\u00bb', '»'],
  ['\u00c2\u00a0', ' '], ['\u00c2\u00b2', '²'], ['\u00c2\u00b7', '·'],
  ['\u00c2\u00ae', '®'], ['\u00c2\u00b4', "'"],
  ['\u00c5\u0093', 'œ'], ['\u00c5\u0092', 'Œ'],
  ['\u00e2\u0080\u0099', "'"], ['\u00e2\u0080\u0098', "'"],
  ['\u00e2\u0080\u009c', '"'], ['\u00e2\u0080\u009d', '"'],
  ['\u00e2\u0080\u0094', '—'], ['\u00e2\u0080\u0093', '–'],
  ['\u00e2\u0080\u00a2', '•'], ['\u00e2\u0086\u0092', '→'],
];

files.forEach(fname => {
  const fpath = 'src/components/' + fname + '.tsx';
  let t = fs.readFileSync(fpath, 'utf8');
  const orig = t;
  fixes.forEach(([bad, good]) => {
    while (t.includes(bad)) {
      t = t.split(bad).join(good);
    }
  });
  if (t !== orig) {
    fs.writeFileSync(fpath, t, 'utf8');
    console.log('Fixed: ' + fname);
  } else {
    console.log('No change: ' + fname);
  }
});

// Also fix server.ts and App.tsx
['server.ts', 'src/App.tsx', 'src/i18n.ts'].forEach(fpath => {
  if (!fs.existsSync(fpath)) return;
  let t = fs.readFileSync(fpath, 'utf8');
  const orig = t;
  fixes.forEach(([bad, good]) => {
    while (t.includes(bad)) t = t.split(bad).join(good);
  });
  if (t !== orig) {
    fs.writeFileSync(fpath, t, 'utf8');
    console.log('Fixed: ' + fpath);
  }
});

console.log('Done!');
