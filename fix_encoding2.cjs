const fs = require('fs');

const files = [
  'ExpensesView','ProcurementView','ReportsView',
  'AdministrationView','InventoryView','ProjectsView','SettingsView'
];

// Additional fixes after first pass
const secondFixes = [
  // Å' -> Œ (œ with capital)  Gros Å'uvres -> Gros Œuvres
  [/Gros Å[''']?uvres/g, "Gros Œuvres"],
  [/Gros Å\u0092uvres/g, "Gros Œuvres"],
  // É‰ -> É (double encoded É)  
  [/É‰/g, 'É'],
  // ³ in "â³" context -> ▷ (pending icon) or just fix "En Attente"
  [/â³ En Attente/g, '⏳ En Attente'],
  [/â[³]/g, '⏳'],
  // Å' -> œ
  [/Å[''`]?/g, 'œ'],
  [/Å\u0092/g, 'Œ'],
  // â€" / â€™ / â€œ / â€ (leftover from earlier mojibake)
  [/â€[""]/g, '"'],
  [/â€['']/g, "'"],
  [/â€"/g, '—'],
  [/â€"/g, '–'],
  [/â€¢/g, '•'],
  [/â‚¬/g, '€'],
  [/Â°/g, '°'],
  [/Âµ/g, 'µ'],
  // ¢ -> remove or fix
  [/¢/g, ''],
  // remaining Ã patterns
  [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ã /g, 'à'], [/Ã§/g, 'ç'],
  [/Ã‰/g, 'É'], [/Ãˆ/g, 'È'], [/Ã€/g, 'À'],
  [/Ã®/g, 'î'], [/Ã¯/g, 'ï'], [/Ãª/g, 'ê'], [/Ã«/g, 'ë'],
  [/Ã´/g, 'ô'], [/Ã¹/g, 'ù'], [/Ã»/g, 'û'], [/Ã¼/g, 'ü'],
  [/Ã‡/g, 'Ç'], [/Ã/g, 'É'],
  // orphaned control chars
  [/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\x8f]/g, ''],
];

files.forEach(fname => {
  const fpath = 'src/components/' + fname + '.tsx';
  let t = fs.readFileSync(fpath, 'utf8');
  const orig = t;
  secondFixes.forEach(([pat, rep]) => { t = t.replace(pat, rep); });
  if (t !== orig) {
    fs.writeFileSync(fpath, t, 'utf8');
    console.log('Fixed: ' + fname);
  } else {
    console.log('No change: ' + fname);
  }
});

console.log('Done!');
