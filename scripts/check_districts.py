#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""校验 districts.ts 的省/市名与 cities.ts 完全对齐（按缩进级别解析 cities.ts 结构）"""
import re

CITIES = r'D:/User/Admin/WorkBuddy/2026-10-13-14-58-45/guoxue-calendar/src/lib/cities.ts'
DISTRICTS = r'D:/User/Admin/WorkBuddy/2026-10-13-14-58-45/guoxue-calendar/src/lib/districts.ts'

def parse_cities(path):
    """按缩进解析：2 空格缩进的省块，其内 4 空格 { name 是城市；兼容单行省块（直辖市/港澳）"""
    provs = []
    cur = None
    for line in open(path, encoding='utf-8'):
        m = re.match(r'^  \{ name: \'([^\']+)\', cities: \[$', line)
        if m:
            cur = {'name': m.group(1), 'cities': []}
            provs.append(cur)
            continue
        m2 = re.match(r'^    \{ name: \'([^\']+)\',', line)
        if m2 and cur is not None:
            cur['cities'].append(m2.group(1))
            continue
        # 单行省块：{ name: '北京市', cities: [{ name: '北京市', lng: 116.41, lat: 39.90 }] },
        m3 = re.match(r"^  \{ name: '([^']+)', cities: \[\{ name: '([^']+)',", line)
        if m3:
            provs.append({'name': m3.group(1), 'cities': [m3.group(2)]})
            cur = None
            continue
    return provs

def parse_districts(path):
    src = open(path, encoding='utf-8').read()
    data = eval(re.search(r'export const DISTRICTS: CountyList = (\{.*\});', src, re.S).group(1))
    return data

def main():
    provs = parse_cities(CITIES)
    districts = parse_districts(DISTRICTS)

    prov_names = [p['name'] for p in provs]
    dist_prov_names = list(districts.keys())
    print(f'cities.ts 省数: {len(prov_names)}  districts 省数: {len(dist_prov_names)}')

    missing_prov = [n for n in prov_names if n not in dist_prov_names]
    extra_prov = [n for n in dist_prov_names if n not in prov_names]
    print('cities 有 districts 无(省):', missing_prov or '无')
    print('districts 有 cities 无(省):', extra_prov or '无')

    total_city = 0
    missing_city = []
    for p in provs:
        d = districts.get(p['name'])
        if d is None:
            continue
        d_names = {c['name'] for c in d}
        for c in p['cities']:
            total_city += 1
            if c not in d_names:
                missing_city.append((p['name'], c))
    print(f'cities.ts 市级总数: {total_city}')
    print('cities 有 districts 无(市):', len(missing_city))
    for pn, cn in missing_city[:40]:
        print('  ', pn, '/', cn)

if __name__ == '__main__':
    main()