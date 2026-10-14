#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 xiangyuecn/AreaCity-JsSpider-StatsGov 的 ok_data_level3.csv（国家地名信息库口径，2026-04 采集）
生成项目县级数据：省 → 市 → 县 三级名称表。
坐标系：县级沿用所属市级政府驻地坐标（同一市内经度差通常<1°，对真太阳时校正影响<2分钟，时辰级排盘无感）。
"""
import csv
import json
import re
import sys

SRC = r'C:/Users/Admin/AppData/Local/Temp/ok_data_level3.csv'
OUT = r'D:/User/Admin/WorkBuddy/2026-10-13-14-58-45/guoxue-calendar/src/lib/districts.ts'

# 直辖市：市级名与省级名相同（如 北京市→北京市），县级正是其下辖区
# 现有 cities.ts 中直辖市只有 1 个市级节点 "北京市"，需要在它下挂县级
MUNICIPAL = {'北京市', '天津市', '上海市', '重庆市'}

# 与 cities.ts 省级名的映射（源数据为统计口径简称，项目用"中国香港/澳门/台湾"）
PROV_NAME_MAP = {
    '台湾省': '中国台湾',
    '香港特别行政区': '中国香港',
    '澳门特别行政区': '中国澳门',
}
DROPPED_PROVS = {'国外'}

# 港澳台市级名映射（源数据与 cities.ts 市名差异，统一到 cities.ts 口径）
CITY_NAME_MAP = {
    '中国香港': {'香港特别行政区': '香港'},
    '中国澳门': {'澳门特别行政区': '澳门'},
}

def load():
    rows = []
    with open(SRC, encoding='utf-8-sig') as f:
        for i, r in enumerate(csv.reader(f)):
            if i == 0 or len(r) < 8:  # 跳过表头
                continue
            cid, pid, deep, name, pyprefix, py, ext_id, ext_name = r
            rows.append({'id': int(cid.strip()), 'pid': int(pid), 'deep': int(deep),
                         'name': name, 'ext_name': ext_name or name})
    return rows

def build():
    rows = load()
    by_id = {r['id']: r for r in rows}
    provs = [r for r in rows if r['deep'] == 0]
    cities = [r for r in rows if r['deep'] == 1]
    counties = [r for r in rows if r['deep'] == 2]
    print(f'省{len(provs)} 市{len(cities)} 县{len(counties)}')

    # 市 → 县级
    city_counties = {}
    orphan = []
    for c in counties:
        city_counties.setdefault(c['pid'], []).append(c)
    for c in cities:
        if c['pid'] not in by_id:
            orphan.append(c)

    # 省直辖县级单位（pid 指向省，deep=1 但实际是县级）：如湖北仙桃/河南济源/海南县市
    sheng_zhixia = [c for c in cities if c['pid'] in by_id and by_id[c['pid']]['deep'] == 0]
    # deep=2 但 pid 是省（直辖市下级）？直辖市只有 deep1+deep2，deep2 的 pid 是市级 id 而非省
    # 省直辖县级单位部分在 deep1（济源等）、部分在 deep2（不入数组）
    print(f'省直辖市级单位(挂在省上): {len(sheng_zhixia)}')

    out = []  # [{name, cities: [{name, counties: [name...]}]}]
    stats = {'with_county': 0, 'no_county': 0}
    for p in provs:
        if p['ext_name'] in DROPPED_PROVS:
            continue
        prov_cities = [c for c in cities if c['pid'] == p['id']]
        # 加上省直辖县级单位（deep=1 但父是省的，追加为特殊市节点）
        zhixia = [c for c in sheng_zhixia if c['pid'] == p['id'] and c['id'] not in {x['id'] for x in prov_cities}]
        p_entry = {'name': PROV_NAME_MAP.get(p['ext_name'], p['ext_name']), 'cities': []}
        city_map = CITY_NAME_MAP.get(p_entry['name'], {})
        merged = {}  # 最终市名 -> counties 列表
        for c in prov_cities:
            ents = sorted(city_counties.get(c['id'], []), key=lambda x: x['ext_name'])
            c_name = city_map.get(c['ext_name'], c['ext_name'])
            # 自引用县级（如 儋州市→儋州市、琼海市→琼海市）显示为「市区」，保留其一
            cns = [('市区' if e['ext_name'] == c['ext_name'] else e['ext_name']) for e in ents]
            if '市区' in cns and len(set(cns)) < len(cns):
                cns = list(dict.fromkeys(cns))
            merged.setdefault(c_name, []).extend(cns)
            stats['with_county' if ents else 'no_county'] += 1
        # 省直辖县级单位挂做普通市
        for c in zhixia:
            ents = sorted(city_counties.get(c['id'], []), key=lambda x: x['ext_name'])
            c_name = city_map.get(c['ext_name'], c['ext_name'])
            cns = [('市区' if e['ext_name'] == c['ext_name'] else e['ext_name']) for e in ents]
            if '市区' in cns and len(set(cns)) < len(cns):
                cns = list(dict.fromkeys(cns))
            merged.setdefault(c_name, []).extend(cns)
            stats['with_county' if ents else 'no_county'] += 1
        # 重庆合并：把「重庆城区/重庆郊县」合并为「重庆市」
        cq = merged.pop('重庆城区', []) + merged.pop('重庆郊县', [])
        if cq:
            merged['重庆市'] = list(dict.fromkeys(cq))
        # 去重（其他市若出现同名合并残留）
        for k in merged:
            merged[k] = list(dict.fromkeys(merged[k]))
        p_entry['cities'] = [{'name': k, 'counties': v} for k, v in merged.items()]
        if p_entry['cities']:
            out.append(p_entry)
    print('统计:', stats)
    return out

def main():
    data = build()
    # 打印几个样例核对
    for p in data:
        if p['name'] in ('广东省', '北京市', '湖北省', '海南省', '中国台湾', '中国香港', '中国澳门'):
            print(f"\n== {p['name']} ({len(p['cities'])}市) ==")
            for c in p['cities'][:4]:
                print('  ', c['name'], '→', len(c['counties']), '县:', c['counties'][:4] if len(c['counties'])<6 else c['counties'][:4]+['…'])
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// 省市县三级名称表（国家地名信息库口径，2026-04 采集自 xiangyuecn/AreaCity-JsSpider-StatsGov）\n')
        f.write('// 县级沿用所属市级政府驻地坐标（经度差<1°，真太阳时影响<2分钟）；「市区」代表整市范围\n')
        f.write('export type CountyList = Record<string, { name: string; counties: string[] }[]>;\n')
        f.write('export const DISTRICTS: CountyList = ')
        f.write(json.dumps({p['name']: p['cities'] for p in data}, ensure_ascii=False, separators=(',', ':')))
        f.write(';\n')
    print(f'\n已写入 {OUT}')

if __name__ == '__main__':
    main()