// 六爻黄金案例回归（转自 metaphysics-steward test_liuyao_golden.py，MIT）
const { paiLiuYao } = require('../../.test/liuyao');

let pass = 0, fail = 0;
function check(name, got, expect) {
  const ok = JSON.stringify(got) === JSON.stringify(expect);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ' expect=' + JSON.stringify(expect)}`);
  ok ? pass++ : fail++;
}

// 案例A: 乾为天 静卦（己丑日）全7
const rA = paiLiuYao([7, 7, 7, 7, 7, 7], { dayGan: '己', dayZhi: '丑', monthZhi: '酉' });
check('A 卦名', rA.ben.name, '乾为天');
check('A 宫', rA.ben.gong, '乾');
check('A 世应', [rA.ben.shi, rA.ben.ying], [6, 3]);
check('A 纳甲', rA.ben.najia, ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌']);
check('A 六亲', rA.ben.liuqin, ['子孙', '妻财', '父母', '官鬼', '兄弟', '父母']);
check('A 六神(初->上)', rA.ben.liushen ?? rA.liushen, ['螣蛇', '白虎', '玄武', '青龙', '朱雀', '勾陈']);
check('A 无变卦', rA.bian, null);

// 案例B: 乾为天 初爻动 -> 天风姤（丙戌日）
const rB = paiLiuYao([9, 7, 7, 7, 7, 7], { dayGan: '丙' });
check('B 主卦', rB.ben.name, '乾为天');
check('B 动爻', rB.moving, [1]);
check('B 变卦名', rB.bian.name, '天风姤');
check('B 变卦宫', rB.bian.gong, '乾');
check('B 变卦世应', [rB.bian.shi, rB.bian.ying], [1, 4]);
check('B 变卦纳甲', rB.bian.najia, ['辛丑', '辛亥', '辛酉', '壬午', '壬申', '壬戌']);
check('B 变卦六亲', rB.bian.liuqin, ['父母', '子孙', '兄弟', '官鬼', '兄弟', '父母']);

// 案例C: 地天泰 初爻动 -> 地风升（跨宫；变卦六亲按主卦坤土）
const rC = paiLiuYao([9, 7, 7, 8, 8, 8], { dayGan: '己' });
check('C 主卦', rC.ben.name, '地天泰');
check('C 主卦宫', rC.ben.gong, '坤');
check('C 主卦世应', [rC.ben.shi, rC.ben.ying], [3, 6]);
check('C 变卦', rC.bian.name, '地风升');
check('C 变卦宫', rC.bian.gong, '震');
check('C 变卦世应', [rC.bian.shi, rC.bian.ying], [4, 1]);
check('C 变卦六亲(坤土)', rC.bian.liuqin, ['兄弟', '妻财', '子孙', '兄弟', '妻财', '子孙']);

console.log(`\n通过 ${pass} / ${pass + fail}`);
process.exit(fail ? 1 : 0);
