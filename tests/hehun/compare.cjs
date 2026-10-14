// 八字合婚回归（对齐 metaphysics-steward test_hehun.py 关键断言，MIT）
const { paiBazi } = require('../../.test/bazi');
const { hehun, personShensha } = require('../../.test/hehun');

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
  cond ? pass++ : fail++;
}

// 1. 生肖六合：男 1984-06-01（甲子鼠） 女 1985-06-01（乙丑牛）
{
  const m = paiBazi(new Date(1984, 5, 1, 10, 0), 1, 116.4, true);
  const f = paiBazi(new Date(1985, 5, 1, 10, 0), 0, 116.4, true);
  const r = hehun(m, f);
  const joined = r.sections.flatMap((s) => s.notes).join('\n');
  check('生肖六合文本', joined.includes('六合'));
  check('评分区间', r.score >= 60 && r.score <= 100, `(${r.score}分)`);
}

// 2. 生肖六冲：男 1996-06-01（丙子鼠） 女 2002-06-01（壬午马）
{
  const m = paiBazi(new Date(1996, 5, 1, 10, 0), 1, 116.4, true);
  const f = paiBazi(new Date(2002, 5, 1, 10, 0), 0, 116.4, true);
  const r = hehun(m, f);
  const joined = r.sections.flatMap((s) => s.notes).join('\n');
  check('生肖六冲文本', joined.includes('相冲'), `(${r.score}分)`);
}

// 3. 日干五合：找甲日男 + 己日女（1985-1990 间扫描）
function findDay(gan) {
  for (let y = 1985; y < 1990; y++)
    for (let mo = 0; mo < 12; mo++)
      for (let d = 1; d < 29; d++) {
        const bz = paiBazi(new Date(y, mo, d, 12, 0), 1, 116.4, true);
        if (bz.pillars.Day.gan === gan) return { date: new Date(y, mo, d, 12, 0), bz };
      }
  return null;
}
{
  const m = findDay('甲');
  const f = findDay('己');
  const r = hehun(m.bz, paiBazi(f.date, 0, 116.4, true));
  const joined = r.sections.flatMap((s) => s.notes).join('\n');
  check('日干五合文本', joined.includes('五合'), `(${r.score}分)`);
}

// 4. 结构校验：十神/藏干/大运/喜用神/神煞
{
  const m = paiBazi(new Date(1990, 1, 4, 10, 40), 1, 116.4, true);
  const f = paiBazi(new Date(1990, 11, 31, 12, 0), 0, 116.4, true);
  check('男四柱', [m.pillars.Year.gz, m.pillars.Month.gz, m.pillars.Day.gz, m.pillars.Hour.gz].join('') === '庚午戊寅庚子辛巳');
  const r = hehun(m, f);
  check('日主十神标', m.pillars.Day.shishen === '日主');
  check('大运条数', m.yun.list.length >= 6 && f.yun.list.length >= 6);
  check('喜用神五行', '木火土金水'.includes(r.male.yongshen.element));
  check('神煞数组', Array.isArray(r.male.shensha) && Array.isArray(r.female.shensha));
  check('大运同频文本', r.sections.some((s) => s.title === '大运同频'));
}

// 5. 神煞警示：1985-01-07 丙午日（阴差阳错+羊刃）
{
  const m = paiBazi(new Date(1985, 0, 7, 0, 0), 1, 116.4, true);
  check('丙午日柱', m.pillars.Day.gz === '丙午', `(got ${m.pillars.Day.gz})`);
  const r = hehun(m, paiBazi(new Date(1990, 5, 1, 10, 0), 0, 116.4, true));
  check('阴差阳错入神煞', r.male.shensha.some((s) => s.name === '阴差阳错'));
  check('警示文本', r.sections.flatMap((s) => s.notes).join('\n').includes('警示'));
}

// 6. 魁罡日：1985-01-11 庚戌日
{
  const f = paiBazi(new Date(1985, 0, 11, 0, 0), 0, 116.4, true);
  check('庚戌日柱', f.pillars.Day.gz === '庚戌', `(got ${f.pillars.Day.gz})`);
  const r = hehun(paiBazi(new Date(1988, 2, 1, 8, 0), 1, 116.4, true), f);
  check('魁罡入神煞', r.female.shensha.some((s) => s.name === '魁罡'));
}

console.log(`\n通过 ${pass} / ${pass + fail}`);
process.exit(fail ? 1 : 0);
