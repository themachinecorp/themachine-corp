#!/usr/bin/env python3
"""
雪球用户动态爬虫
用法: python3 user_timeline.py -u _uid
"""
import requests
import argparse
import json
import sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Accept": "application/json",
    "Referer": "https://xueqiu.com",
}

def get_user_timeline(uid, page=1, count=20):
    """获取用户动态"""
    url = f"https://xueqiu.com/v4/statuses/user_timeline.json?user_id={uid}&page={page}&count={count}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        data = resp.json()
        return data.get("statuses", [])
    except Exception as e:
        print(f"请求失败: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="雪球用户动态")
    parser.add_argument("-u", "--uid", required=True, help="用户ID")
    parser.add_argument("-p", "--page", type=int, default=1, help="页码")
    parser.add_argument("-n", "--count", type=int, default=20, help="条数")
    args = parser.parse_args()
    
    posts = get_user_timeline(args.uid, args.page, args.count)
    
    if not posts:
        print("未获取到动态")
        sys.exit(1)
    
    print(f"\n📝 雪球用户动态 (UID: {args.uid})：\n")
    for i, p in enumerate(posts, 1):
        text = p.get("text", "")[:150]
        time = p.get("created_at", "")
        print(f"{i}. {text}...")
        print()
        
    if len(posts) == args.count:
        print(f"更多动态: python3 user_timeline.py -u {args.uid} -p {args.page+1}")

if __name__ == "__main__":
    main()
