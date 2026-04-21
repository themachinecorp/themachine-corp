#!/usr/bin/env python3
"""
雪球基金净值查询
用法: python3 fund.py -f 000001
"""
import requests
import argparse
import sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    "Accept": "application/json",
    "Referer": "https://xueqiu.com",
}

def get_fund_nav(fund_code):
    """获取基金净值"""
    url = f"https://stock.xueqiu.com/v5/fund/f10/nav.json?symbol={fund_code}&count=1&type=1"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        data = resp.json()
        return data.get("data", {})
    except Exception as e:
        print(f"请求失败: {e}")
        return {}

def main():
    parser = argparse.ArgumentParser(description="雪球基金净值")
    parser.add_argument("-f", "--fund", required=True, help="基金代码")
    args = parser.parse_args()
    
    nav_data = get_fund_nav(args.fund)
    
    if not nav_data:
        print("未获取到基金数据")
        sys.exit(1)
    
    # 解析净值数据
    items = nav_data.get("items", [])
    if items:
        item = items[0]
        print(f"\n💰 基金 {args.fund} 净值信息：")
        print(f"   最新净值: {item.get('nav', 'N/A')}")
        print(f"   日增长率: {item.get('daily_return', 'N/A')}%")
        print(f"   日期: {item.get('date', 'N/A')}")
    else:
        print("未获取到净值数据")

if __name__ == "__main__":
    main()
