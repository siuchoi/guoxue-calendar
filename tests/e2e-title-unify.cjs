// E2E: 验证 7 个排盘页「section-title + GuideCard」结构统一
const { chromium } = require('playwright-core');
const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';

const PAGES = [
  { tab: '六壬排盘', title: '六壬 · 排盘' },
  { tab: '梅花易数', title: '梅花易数 · 起卦' },
  { tab: '六爻排盘', title: '六爻 · 摇卦' },
  { tab: '金口诀', title: '金口诀 · 起课' },
  { tab: '奇门遁甲', title: '时家奇门 · 起局' },
  { tab: '紫微斗数', title: '紫微斗数 · 排盘' },
  { tab: '八字合婚', title: '八字 · 排盘' },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  let fail = 0;
  const ok = (cond, msg) => { console.log(`  ${cond ? 'PASS' : 'FAIL'} ${msg}`); if (!cond) fail++; };

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  for (const p of PAGES) {
    await page.locator('nav button', { hasText: p.tab }).first().click();
    await page.waitForTimeout(400);
    const firstCard = page.locator('.card').first();
    const title = firstCard.locator('.section-title').first();
    const guide = firstCard.locator('.guide-card');
    console.log(`== ${p.tab} ==`);
    ok(await title.count() === 1, `有 section-title 标题`);
    ok((await title.textContent()).includes(p.title), `标题文案「${p.title}」，实际「${(await title.textContent()).trim()}」`);
    ok(await guide.count() === 1, `有 GuideCard`);
    // 标题在 GuideCard 之前
    const tY = (await title.boundingBox()).y;
    const gY = (await guide.boundingBox()).y;
    ok(tY < gY, `标题在说明卡上方 (${Math.round(tY)} < ${Math.round(gY)})`);
  }

  // 截六爻页效果图
  await page.locator('nav button', { hasText: '六爻排盘' }).first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'tests/shots/liuyao-unified.png', clip: { x: 0, y: 0, width: 1100, height: 640 } });

  await browser.close();
  console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
