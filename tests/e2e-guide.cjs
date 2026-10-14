// E2E: 7 个排盘/占卜模块的玩法说明卡（GuideCard）
// 验证：①各页渲染出 guide-card ②摘要标题正确 ③默认展开（body 可见）④可折叠（点击 summary 后收起再展开）⑤样式生效
const { chromium } = require('playwright-core');

const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = 'http://localhost:5173/';

let pass = 0, fail = 0;
const log = (m) => console.log(m);
const ok = (cond, name) => {
  if (cond) { pass++; log(`  ✅ ${name}`); }
  else { fail++; log(`  ❌ ${name}`); }
};

// tab 名与期望的玩法卡片标题（含关键词）
const TABS = [
  { tab: '六壬排盘', key: '大六壬', id: 'liuren' },
  { tab: '梅花易数', key: '梅花易数', id: 'meihua' },
  { tab: '六爻排盘', key: '六爻', id: 'liuyao' },
  { tab: '金口诀', key: '金口诀', id: 'jinkoujue' },
  { tab: '奇门遁甲', key: '奇门遁甲', id: 'qimen' },
  { tab: '紫微斗数', key: '紫微斗数', id: 'ziwei' },
  { tab: '八字合婚', key: '八字', id: 'bazi' },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  for (const t of TABS) {
    log(`\n== ${t.tab} ==`);
    // 点导航 tab
    const tabBtn = page.locator('.tabs button').filter({ hasText: t.tab });
    await tabBtn.first().click();
    await page.waitForTimeout(600);

    const card = page.locator('.guide-card');
    const cnt = await card.count();
    ok(cnt >= 1, `页面渲染 guide-card（${cnt} 个）`);

    const title = await card.first().locator('.guide-title').textContent().catch(() => '');
    ok(title.includes(t.key), `标题「${title.trim()}」含关键词「${t.key}」`);

    const badge = await card.first().locator('.guide-badge').textContent().catch(() => '');
    ok(badge.trim() === '玩法', `右上角徽标=玩法（实际 ${badge.trim()}）`);

    // 默认展开
    const isOpen = await card.first().getAttribute('open').catch(() => null);
    ok(isOpen !== null, '默认展开（details 带 open）');

    const bodyVisible = await card.first().locator('.guide-body').isVisible().catch(() => false);
    ok(bodyVisible, '玩法正文可见');

    // 正文要点
    const intro = await card.first().locator('.guide-intro').textContent().catch(() => '');
    ok(intro.trim().length > 5, `有引言「${intro.trim().slice(0, 20)}…」`);

    const steps = await card.first().locator('.guide-step').count().catch(() => 0);
    ok(steps >= 3, `至少有 3 个步骤（实际 ${steps}）`);

    // 折叠/展开
    await card.first().locator('.guide-head').click();
    await page.waitForTimeout(200);
    const closedBody = await card.first().locator('.guide-body').isVisible().catch(() => true);
    ok(!closedBody, '点击标题可收起');
    await card.first().locator('.guide-head').click();
    await page.waitForTimeout(200);
    const reopened = await card.first().locator('.guide-body').isVisible().catch(() => false);
    ok(reopened, '再次点击可展开');
  }

  log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });