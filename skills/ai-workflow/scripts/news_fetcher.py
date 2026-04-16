#!/usr/bin/env python3
"""
新闻获取器 - 支持多源
用法: python3 news_fetcher.py -s 科技 -n 10 -o news.json
"""
import requests
import argparse
import json
import sys
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

# 内置新闻源（可扩展）
NEWS_SOURCES = {
    "sina": "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k={}&num=10&page=1",
    "tencent": "https://news.qq.com/interface/roll.php?vid=index&action=rollnews&p=0&n=10",
}

def fetch_from_source(source, keyword="", count=10):
    """从指定源获取新闻"""
    url = NEWS_SOURCES.get(source, "").format(keyword) if source in NEWS_SOURCES else ""
    if not url:
        return []
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        data = resp.json()
        articles = []
        
        if source == "sina":
            for item in data.get("result", {}).get("data", [])[:count]:
                articles.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "source": item.get("media_name", "新浪"),
                    "date": item.get("ctime", ""),
                    "summary": item.get("intro", "")[:100],
                })
        elif source == "tencent":
            for item in data.get("roll_data", [])[:count]:
                articles.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "source": item.get("source", "腾讯"),
                    "date": item.get("publish_time", ""),
                })
        return articles
    except Exception as e:
        print(f"获取失败 ({source}): {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="新闻获取器")
    parser.add_argument("-s", "--source", default="sina", choices=["sina", "tencent"], help="新闻源")
    parser.add_argument("-k", "--keyword", default="", help="关键词过滤")
    parser.add_argument("-n", "--count", type=int, default=10, help="数量")
    parser.add_argument("-o", "--output", help="输出JSON文件")
    args = parser.parse_args()
    
    print(f"📡 从 {args.source} 获取新闻...")
    articles = fetch_from_source(args.source, args.keyword, args.count)
    
    if not articles:
        print("未获取到新闻")
        sys.exit(1)
    
    print(f"✅ 获取到 {len(articles)} 条新闻\n")
    for i, art in enumerate(articles, 1):
        print(f"{i}. {art['title']}")
        print(f"   {art['source']} | {art.get('date', '')}")
        print()
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"💾 已保存到 {args.output}")

if __name__ == "__main__":
    main()
