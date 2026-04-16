#!/usr/bin/env python3
"""
雪球股票评论爬虫
用法: python3 comments.py -s 贵州茅台
"""
import requests
import argparse
import json
import sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Accept": "application/json",
    "Referer": "https://xueqiu.com",
}

def search_stock(query):
    """搜索股票代码"""
    url = f"https://xueqiu.com/query.json?q={query}&type=s&count=5&page=1"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    data = resp.json()
    stocks = data.get("stocks", [])
    if not stocks:
        print(f"未找到股票: {query}")
        return None
    return stocks[0]

def get_comments(symbol, count=20):
    """获取股票评论"""
    # 先搜索股票获取symbol
    stock = search_stock(symbol)
    if not stock:
        return []
    
    stock_symbol = stock.get("symbol", "")
    code = stock.get("code", "")
    
    # 雪球API获取评论
    url = f"https://stock.xueqiu.com/v5/stock/f10/cn/company.json?symbol={code}&count={count}&type=all"
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        data = resp.json()
        return data.get("list", []) if "list" in data else []
    except Exception as e:
        print(f"API请求失败: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="雪球股票评论爬虫")
    parser.add_argument("-s", "--stock", required=True, help="股票名称或代码")
    parser.add_argument("-n", "--count", type=int, default=20, help="评论数量")
    parser.add_argument("--pretty", action="store_true", help="格式化输出")
    args = parser.parse_args()
    
    comments = get_comments(args.stock, args.count)
    
    if not comments:
        print("未获取到评论数据")
        sys.exit(1)
    
    stock = search_stock(args.stock)
    print(f"\n📊 {stock.get('name', args.stock)} ({stock.get('code', '')}) 最新评论：\n")
    
    for i, c in enumerate(comments[:args.count], 1):
        title = c.get("title", "")
        summary = c.get("summary", "")[:100]
        time = c.get("created_at", "")
        print(f"{i}. {title}")
        if summary:
            print(f"   {summary}...")
        print()

if __name__ == "__main__":
    main()
