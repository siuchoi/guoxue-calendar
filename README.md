# 观玄 · 国学日历

一个纯前端的国学日历应用：黄历宜忌、干支四柱、真太阳时、地支时钟、大六壬排盘。

## 功能

- **国学日历**：月历视图（公历 / 农历 / 干支 / 节日 / 节气精确到分钟）、当日黄历（宜忌、吉神凶煞、神煞方位、彭祖百忌、建除十二值、十二神黄黑道、冲煞、星宿、纳音）、干支四柱（含十神）、实时天气
- **地支时钟**：十二时辰 SVG 表盘，北京时间与真太阳时（经度修正 + 均时差）双读数，时辰养生提示
- **六壬排盘**：大六壬起课——月将加时排天地盘、四课、三传（九宗门：元首 / 重审 / 知一 / 涉害 / 遥克 / 昴星 / 别责 / 八专 / 伏吟 / 返吟）、十二天将、旬遁干、空亡、六亲、课体判定

## 技术栈

- Vite + React 18 + TypeScript
- [lunar-typescript](https://github.com/6tail/lunar-typescript)（农历 / 黄历 / 节气算法）
- 自研大六壬引擎（`src/lib/liuren.ts`）
- [Open-Meteo](https://open-meteo.com/) 免费天气 API（无需 key）

## 本地运行

```bash
npm install --ignore-scripts   # 沙箱/受限环境需跳过 esbuild postinstall
npm run dev                    # http://127.0.0.1:5173
```

## 构建

```bash
npm run build
```

纯静态产物，可部署到任意静态托管（GitHub Pages / Vercel / Cloudflare Pages）。

## 说明

- 涉害课深浅采用「临宫归本家步数」算法，深浅相同时先孟后仲
- 昼夜贵人按占时划分：卯至申为昼（旦贵），酉至寅为夜（暮贵）
- 仅供学习研究传统历法与术数文化
