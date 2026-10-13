/**
 * 真太阳时 = 平太阳时（当地时间）+ 均时差
 * 平太阳时 = 北京时间 + (经度 - 120°E) × 4 分钟
 * 均时差（Equation of Time）用 Fourier 近似，误差约 ±30 秒
 */

/** 均时差（分钟），dayOfYear 从 1 开始 */
export function equationOfTime(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const g = (2 * Math.PI * (dayOfYear - 1)) / 365;
  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(g) -
    0.032077 * Math.sin(g) -
    0.014615 * Math.cos(2 * g) -
    0.040849 * Math.sin(2 * g)
  );
}

/** 由北京时间与经度求真太阳时 */
export function trueSolarTime(beijingTime: Date, lng: number): Date {
  const lngOffsetMin = (lng - 120) * 4;
  const eotMin = equationOfTime(beijingTime);
  return new Date(beijingTime.getTime() + (lngOffsetMin + eotMin) * 60000);
}

/** 由时分推时辰支索引：子=0（23:00-00:59），丑=1 … */
export function hourToShiChen(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

/** 时辰名称与起讫 */
export const SHI_CHEN_INFO = [
  { zhi: 0, name: '子时', range: '23:00 - 00:59', tip: '胆经当令，宜熟睡养阳' },
  { zhi: 1, name: '丑时', range: '01:00 - 02:59', tip: '肝经当令，深睡排毒' },
  { zhi: 2, name: '寅时', range: '03:00 - 04:59', tip: '肺经当令，宜静卧' },
  { zhi: 3, name: '卯时', range: '05:00 - 06:59', tip: '大肠经当令，宜起身排便' },
  { zhi: 4, name: '辰时', range: '07:00 - 08:59', tip: '胃经当令，宜吃早餐' },
  { zhi: 5, name: '巳时', range: '09:00 - 10:59', tip: '脾经当令，宜工作学习' },
  { zhi: 6, name: '午时', range: '11:00 - 12:59', tip: '心经当令，宜小憩' },
  { zhi: 7, name: '未时', range: '13:00 - 14:59', tip: '小肠经当令，宜清淡午餐后活动' },
  { zhi: 8, name: '申时', range: '15:00 - 16:59', tip: '膀胱经当令，宜饮水运动' },
  { zhi: 9, name: '酉时', range: '17:00 - 18:59', tip: '肾经当令，宜晚餐清淡' },
  { zhi: 10, name: '戌时', range: '19:00 - 20:59', tip: '心包经当令，宜散步放松' },
  { zhi: 11, name: '亥时', range: '21:00 - 22:59', tip: '三焦经当令，宜入睡准备' },
];
