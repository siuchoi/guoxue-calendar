/** 省市经纬度数据（省会+主要城市，覆盖全部省级行政区） */
export interface City { name: string; lng: number; lat: number }
export interface Province { name: string; cities: City[] }

export const PROVINCES: Province[] = [
  { name: '北京市', cities: [{ name: '北京市', lng: 116.41, lat: 39.90 }] },
  { name: '天津市', cities: [{ name: '天津市', lng: 117.20, lat: 39.13 }] },
  { name: '河北省', cities: [
    { name: '石家庄市', lng: 114.51, lat: 38.04 }, { name: '唐山市', lng: 118.18, lat: 39.63 },
    { name: '秦皇岛市', lng: 119.60, lat: 39.94 }, { name: '保定市', lng: 115.46, lat: 38.87 },
  ]},
  { name: '山西省', cities: [
    { name: '太原市', lng: 112.55, lat: 37.87 }, { name: '大同市', lng: 113.30, lat: 40.08 },
  ]},
  { name: '内蒙古自治区', cities: [
    { name: '呼和浩特市', lng: 111.75, lat: 40.84 }, { name: '包头市', lng: 109.84, lat: 40.66 },
  ]},
  { name: '辽宁省', cities: [
    { name: '沈阳市', lng: 123.43, lat: 41.80 }, { name: '大连市', lng: 121.61, lat: 38.91 },
  ]},
  { name: '吉林省', cities: [
    { name: '长春市', lng: 125.32, lat: 43.82 }, { name: '吉林市', lng: 126.55, lat: 43.84 },
  ]},
  { name: '黑龙江省', cities: [
    { name: '哈尔滨市', lng: 126.53, lat: 45.80 }, { name: '大庆市', lng: 125.10, lat: 46.59 },
  ]},
  { name: '上海市', cities: [{ name: '上海市', lng: 121.47, lat: 31.23 }] },
  { name: '江苏省', cities: [
    { name: '南京市', lng: 118.80, lat: 32.06 }, { name: '苏州市', lng: 120.58, lat: 31.30 },
    { name: '无锡市', lng: 120.31, lat: 31.49 }, { name: '徐州市', lng: 117.28, lat: 34.20 },
  ]},
  { name: '浙江省', cities: [
    { name: '杭州市', lng: 120.16, lat: 30.29 }, { name: '宁波市', lng: 121.55, lat: 29.87 },
    { name: '温州市', lng: 120.65, lat: 28.01 },
  ]},
  { name: '安徽省', cities: [
    { name: '合肥市', lng: 117.28, lat: 31.86 }, { name: '芜湖市', lng: 118.38, lat: 31.33 },
  ]},
  { name: '福建省', cities: [
    { name: '福州市', lng: 119.30, lat: 26.08 }, { name: '厦门市', lng: 118.09, lat: 24.48 },
    { name: '泉州市', lng: 118.68, lat: 24.87 },
  ]},
  { name: '江西省', cities: [
    { name: '南昌市', lng: 115.86, lat: 28.68 }, { name: '赣州市', lng: 114.93, lat: 25.83 },
  ]},
  { name: '山东省', cities: [
    { name: '济南市', lng: 117.12, lat: 36.65 }, { name: '青岛市', lng: 120.38, lat: 36.07 },
    { name: '烟台市', lng: 121.45, lat: 37.46 },
  ]},
  { name: '河南省', cities: [
    { name: '郑州市', lng: 113.63, lat: 34.75 }, { name: '洛阳市', lng: 112.45, lat: 34.62 },
    { name: '开封市', lng: 114.31, lat: 34.80 },
  ]},
  { name: '湖北省', cities: [
    { name: '武汉市', lng: 114.31, lat: 30.59 }, { name: '宜昌市', lng: 111.29, lat: 30.69 },
    { name: '襄阳市', lng: 112.12, lat: 32.01 },
  ]},
  { name: '湖南省', cities: [
    { name: '长沙市', lng: 112.94, lat: 28.23 }, { name: '株洲市', lng: 113.13, lat: 27.83 },
  ]},
  { name: '广东省', cities: [
    { name: '广州市', lng: 113.26, lat: 23.13 }, { name: '深圳市', lng: 114.06, lat: 22.55 },
    { name: '珠海市', lng: 113.58, lat: 22.27 }, { name: '汕头市', lng: 116.68, lat: 23.35 },
    { name: '佛山市', lng: 113.12, lat: 23.02 }, { name: '东莞市', lng: 113.75, lat: 23.02 },
  ]},
  { name: '广西壮族自治区', cities: [
    { name: '南宁市', lng: 108.32, lat: 22.82 }, { name: '桂林市', lng: 110.29, lat: 25.27 },
    { name: '柳州市', lng: 109.42, lat: 24.33 },
  ]},
  { name: '海南省', cities: [
    { name: '海口市', lng: 110.32, lat: 20.03 }, { name: '三亚市', lng: 109.51, lat: 18.25 },
  ]},
  { name: '重庆市', cities: [{ name: '重庆市', lng: 106.55, lat: 29.56 }] },
  { name: '四川省', cities: [
    { name: '成都市', lng: 104.07, lat: 30.57 }, { name: '绵阳市', lng: 104.68, lat: 31.47 },
    { name: '宜宾市', lng: 104.64, lat: 28.75 },
  ]},
  { name: '贵州省', cities: [
    { name: '贵阳市', lng: 106.63, lat: 26.65 }, { name: '遵义市', lng: 106.93, lat: 27.73 },
  ]},
  { name: '云南省', cities: [
    { name: '昆明市', lng: 102.83, lat: 24.88 }, { name: '大理市', lng: 100.23, lat: 25.59 },
    { name: '丽江市', lng: 100.23, lat: 26.88 },
  ]},
  { name: '西藏自治区', cities: [
    { name: '拉萨市', lng: 91.11, lat: 29.66 }, { name: '日喀则市', lng: 88.88, lat: 29.27 },
  ]},
  { name: '陕西省', cities: [
    { name: '西安市', lng: 108.94, lat: 34.34 }, { name: '咸阳市', lng: 108.71, lat: 34.33 },
    { name: '宝鸡市', lng: 107.24, lat: 34.36 },
  ]},
  { name: '甘肃省', cities: [
    { name: '兰州市', lng: 103.83, lat: 36.06 }, { name: '敦煌市', lng: 94.66, lat: 40.14 },
  ]},
  { name: '青海省', cities: [
    { name: '西宁市', lng: 101.78, lat: 36.62 }, { name: '格尔木市', lng: 94.90, lat: 36.41 },
  ]},
  { name: '宁夏回族自治区', cities: [
    { name: '银川市', lng: 106.23, lat: 38.49 }, { name: '石嘴山市', lng: 106.38, lat: 39.01 },
  ]},
  { name: '新疆维吾尔自治区', cities: [
    { name: '乌鲁木齐市', lng: 87.62, lat: 43.83 }, { name: '喀什市', lng: 75.99, lat: 39.47 },
    { name: '伊宁市', lng: 81.32, lat: 43.92 },
  ]},
  { name: '中国香港', cities: [{ name: '香港', lng: 114.17, lat: 22.30 }] },
  { name: '中国澳门', cities: [{ name: '澳门', lng: 113.54, lat: 22.20 }] },
  { name: '中国台湾', cities: [
    { name: '台北市', lng: 121.56, lat: 25.03 }, { name: '高雄市', lng: 120.31, lat: 22.62 },
  ]},
];

export const DEFAULT_CITY: City = { name: '深圳市', lng: 114.06, lat: 22.55 };
