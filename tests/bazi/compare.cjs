// 八字换柱黄金回归（语料转自 metaphysics-steward test_bazi_golden.py，MIT）
const fs = require('fs');
const path = require('path');
const { paiBazi } = require('../../.test/bazi');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf-8')).cases;

let pass = 0;
const fails = [];
for (const c of cases) {
  const [y, m, d, h, mi] = c.dt;
  try {
    const r = paiBazi(new Date(y, m - 1, d, h, mi), 1, c.lon, !!c.zty);
    const got = [r.pillars.Year.gz, r.pillars.Month.gz, r.pillars.Day.gz, r.pillars.Hour.gz];
    if (JSON.stringify(got) === JSON.stringify(c.pillars)) pass++;
    else fails.push(`${c.label} ${y}-${m}-${d} ${h}:${mi}: got=${got.join('/')} expect=${c.pillars.join('/')}`);
  } catch (e) {
    fails.push(`${c.label}: ERROR ${e.message}`);
  }
}
console.log(`\n通过 ${pass} / ${cases.length}`);
fails.slice(0, 10).forEach((f) => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
