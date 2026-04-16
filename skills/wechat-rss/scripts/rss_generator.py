#!/usr/bin/env python3
"""
RSS生成器 - 微信公众号
用法: python3 rss_generator.py -a 财经早餐 -o ~/feeds/caijing.xml
"""
import requests
from bs4 import BeautifulSoup
import argparse
import sys
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

def search_account(account_name):
    """搜索公众号获取biz"""
    url = f"https://weixin.sogou.com/weixin?type=1&query={account_name}&ie=utf8"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        account = soup.select_one("p.tit a")
        if account:
            # 获取biz参数需要进一步访问
            biz_url = account.get("href", "")
            return {"name": account.get_text(strip=True), "url": biz_url}
    except Exception as e:
        print(f"搜索失败: {e}")
    return None

def generate_rss_xml(title, link, articles):
    """生成RSS XML"""
    items = ""
    for art in articles:
        items += f"""
    <item>
        <title><![CDATA[{art['title']}]]></title>
        <link>{art['url']}</link>
        <description><![CDATA[{art.get('summary', '')}]]></description>
        <pubDate>{art.get('date', '')}</pubDate>
        <author>{art.get('source', '')}</author>
    </item>"""
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>{title}</title>
        <link>{link}</link>
        <description>微信公众号 RSS 订阅源</description>
        <language>zh-cn</language>
        <lastBuildDate>{datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0800')}</lastBuildDate>{items}
    </channel>
</rss>"""

def main():
    parser = argparse.ArgumentParser(description="微信公众号RSS生成器")
    parser.add_argument("-a", "--account", required=True, help="公众号名称")
    parser.add_argument("-o", "--output", required=True, help="RSS输出路径")
    parser.add_argument("-n", "--count", type=int, default=10, help="文章数量")
    args = parser.parse_args()
    
    # 搜索公众号
    account_info = search_account(args.account)
    if not account_info:
        print(f"未找到公众号: {args.account}")
        sys.exit(1)
    
    print(f"📰 找到公众号: {account_info['name']}")
    
    # 搜索文章获取URL
    from sogou_search import search_wechat
    articles = search_wechat(args.account, args.count)
    
    # 生成RSS
    rss = generate_rss_xml(
        title=account_info['name'],
        link=account_info['url'],
        articles=articles
    )
    
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(rss)
    
    print(f"✅ RSS已生成: {args.output}")

if __name__ == "__main__":
    main()
