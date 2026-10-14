// E2E：合婚页省市县三级联动验证（v2：定位修正版）
const { chromium } = require('playwright-core');

const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';
const URL = 'http://127.0.0.1:5173/';

const log = (m) => console.log(m);
let okCount = 0, failCount = 0;
function assert(cond, msg) {
  if (cond) { okCount++; log('  ✔ ' + msg); }
  else { failCount++; log('  ✘ FAIL: ' + msg); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });

  // 先点 nav tab 进入八字页，再点模式按钮「合婚」
  await page.click('nav.tabs button:has-text("八字合婚")');
  await page.waitForTimeout(500);
  const modeBtns = page.locator('.mh-mode button');
  await modeBtns.filter({ hasText: '合婚' }).click();
  await page.waitForTimeout(500);
  log('== 进入合婚模式 ==');

  // 形态断言：两个 bz-form，且无性别下拉
  const forms = page.locator('.bz-form');
  assert(await forms.count() === 2, '合婚模式渲染男方+女方两个表单');
  const sexVisible = await page.locator('.bz-form select').filter({ has: page.locator('option', { hasText: '乾造' }) }).count();
  assert(sexVisible === 0, '合婚模式隐藏性别下拉');

  // 每个表单最后 3 个 select = 省/市/县
  async function getAddrSelects(formIdx) {
    const f = forms.nth(formIdx);
    const sels = await f.locator('select').all();
    const n = sels.length;
    if (n < 3) throw new Error(`form${formIdx} select 不足: ${n}`);
    return sels.slice(n - 3); // [省, 市, 县]
  }
  const male = await getAddrSelects(0);
  const female = await getAddrSelects(1);
  log('male select 数: ' + (await forms.nth(0).locator('select').count()));

  const selVal = async (h) => await h.inputValue();
  const selOpts = async (h) => await h.locator('option').allTextContents();

  log('=== 男方默认值 ===');
  assert(await selVal(male[0]) === '广东省', '默认省=广东省');
  assert(await selVal(male[1]) === '深圳市', '默认市=深圳市');
  assert(await selVal(male[2]) === '南山区', '默认县=南山区');

  log('=== 切省联动 ===');
  const provOpts = await selOpts(male[0]);
  await male[0].selectOption(provOpts[provOpts.indexOf('浙江省')]);
  await page.waitForTimeout(250);
  assert(await selVal(male[0]) === '浙江省', '省=浙江省');
  assert(await selVal(male[1]) === '杭州市', '市联动=杭州市');
  assert(await selVal(male[2]) === '上城区', '县联动=上城区(首县)');

  log('=== 切市联动 ===');
  const cityOpts = await selOpts(male[1]);
  const nbIdx = cityOpts.indexOf('宁波市');
  assert(nbIdx >= 0, '浙江省市下拉含宁波市');
  await male[1].selectOption({ index: nbIdx });
  await page.waitForTimeout(250);
  const distOpts = await selOpts(male[2]);
  assert(distOpts.includes('海曙区'), '宁波县级含海曙区');
  assert(await selVal(male[2]) === distOpts[0], '切市后县自动取首项');

  log('=== 直辖市 ===');
  await male[0].selectOption('北京市');
  await page.waitForTimeout(250);
  assert(await selVal(male[1]) === '北京市', '北京市=北京市');
  const bjDist = await selOpts(male[2]);
  assert(bjDist.includes('海淀区') && bjDist.includes('朝阳区'), '北京县级含海淀/朝阳');

  log('=== 切广东深圳南山 出盘 ===');
  await male[0].selectOption('广东省');
  await page.waitForTimeout(250);
  await male[1].selectOption('深圳市');
  await page.waitForTimeout(250);
  await male[2].selectOption('南山区');
  // 女方也设一个不同地区，验证两表独立：女 → 湖南 长沙 岳麓区
  await female[0].selectOption('湖南省');
  await page.waitForTimeout(250);
  await female[1].selectOption('长沙市');
  await page.waitForTimeout(250);
  const csDist = await selOpts(female[2]);
  assert(csDist.includes('岳麓区'), '长沙县级含岳麓区');
  await female[2].selectOption('岳麓区');
  assert(await selVal(male[2]) === '南山区', '男方县未受影响（两表独立）');

  await page.click('.ly-cast-btn:has-text("合婚")');
  await page.waitForTimeout(700);
  const score = await page.locator('.hh-score-num').textContent();
  assert(score !== null && /^\d{1,3}$/.test(score.trim()), '合婚出评分: ' + (score || '').trim());

  log(`\n===== E2E 结果: ${okCount} 通过 / ${failCount} 失败 =====`);
  await browser.close();
  process.exit(failCount ? 1 : 0);
})().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(2); });