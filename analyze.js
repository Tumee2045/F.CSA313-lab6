// PICT-ийн гаралтыг уншиж мөр бүрийн алдааны тоо, happy path, боломжгүй хослолыг тоолно.
// Ажиллуулах: node analyze.js > results/row-analysis.txt
const fs = require('fs');

// Хэсэг A-гийн [ERROR] утгууд (сонголт -> алдаа үүсгэдэг утгууд)
const ERROR_VALUES = {
  From: ['Frozen', 'Missing'],
  To: ['Missing', 'SameAsFrom'],
  Amount: ['Zero', 'OverBalance', 'OverBalanceAfterFX', 'OverLimit'],
  DailyUsed: ['Exhausted'],
};

// A2-ын [IF] хязгаарлалтыг зөрчсөн (утгагүй/боломжгүй) мөр үү?
function impossible(r) {
  const why = [];
  if (r.Amount === 'OverBalanceAfterFX' && r.Currency !== 'Different') why.push('OverBalanceAfterFX + Currency=Same');
  if (r.From === 'Missing' && !['Normal', 'Zero'].includes(r.Amount)) why.push('From=Missing + Amount=' + r.Amount);
  if (r.From === 'Missing' && r.DailyUsed !== 'None') why.push('From=Missing + DailyUsed=' + r.DailyUsed);
  return why;
}

function analyze(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = lines[0].split('\t');
  const rows = lines.slice(1).map((l) => {
    const cells = l.split('\t').map((c) => c.replace(/^~/, '')); // ~ тэмдгийг хасна
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });

  const dist = {};
  let happy = 0, max = 0, bad = 0;
  const badRows = [];
  rows.forEach((r, i) => {
    const errors = Object.entries(ERROR_VALUES).filter(([k, v]) => v.includes(r[k])).length;
    dist[errors] = (dist[errors] || 0) + 1;
    if (errors === 0) happy++;
    if (errors > max) max = errors;
    const why = impossible(r);
    if (why.length) { bad++; badRows.push(`    мөр ${i + 1}: ${why.join('; ')}`); }
  });

  console.log(`== ${file} ==`);
  console.log(`  rows: ${rows.length}`);
  console.log(`  happy path rows (0 errors): ${happy}`);
  Object.keys(dist).sort().forEach((k) => console.log(`  rows with ${k} error(s): ${dist[k]}`));
  console.log(`  max errors in one row: ${max}`);
  console.log(`  impossible rows (violate A2 IF constraints): ${bad}`);
  badRows.forEach((b) => console.log(b));
  console.log('');
}

['results/transfer-nc.txt', 'results/transfer.txt', 'results/transfer-neg.txt']
  .concat(fs.existsSync('results/transfer-neg-nc.txt') ? ['results/transfer-neg-nc.txt'] : [])
  .forEach(analyze);
