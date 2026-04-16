#!/usr/bin/env python3
"""
搜狗微信搜索（标准库版本）
用法: python3 sogou_search.py -k "关键词"
"""
import requests
import argparse
import sys
import re
from html.parser import HTMLParser

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

class WechatParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.in_source = False
        self.in_date = False
        self.results = []
        self.current = {}
        self._tag_stack = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self._tag_stack.append((tag, attrs_dict))
        
        # 查找标题
        if tag == 'h3':
            for prev_tag, _ in self._tag_stack[-2:]:
                if prev_tag == 'div' and 'txt-box' in str(self._tag_stack):
                    self.in_title = True
                    return
        
        # 查找来源账号
        if tag == 'a' and 'account' in attrs_dict.get('class', ''):
            self.in_source = True
            return
            
        # 查找日期
        if tag == 'span' and 's2' in attrs_dict.get('class', ''):
            self.in_date = True
            
    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
        if self.in_title and len(data) > 10:
            self.current['title'] = data
            self.in_title = False
        elif self.in_source:
            self.current['source'] = data
            self.in_source = False
        elif self.in_date:
            self.current['date'] = data
            self.in_date = False
            
    def handle_endtag(self, tag):
        if self._tag_stack and self._tag_stack[-1][0] == tag:
            self._tag_stack.pop()
        if tag == 'h3':
            self.in_title = False
        if tag == 'a':
            self.in_source = False
        if tag == 'span':
            self.in_date = False

def search_wechat(keyword, count=10):
    """搜狗微信搜索"""
    results = []
    url = f"https://weixin.sogou.com/weixin?type=2&query={keyword}&ie=utf8"
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.encoding = 'utf-8'
        
        # 简单正则提取
        # 模式: <h3><a href="URL">标题</a></h3>
        titles = re.findall(r'<h3[^>]*><a[^>]*href="([^"]+)"[^>]*>([^<]+)</a></h3>', resp.text)
        sources = re.findall(r'<a[^>]*class="account"[^>]*>([^<]+)</a>', resp.text)
        dates = re.findall(r'<span[^>]*class="s2"[^>]*>([^<]+)</span>', resp.text)
        
        for i, (url, title) in enumerate(titles[:count]):
            results.append({
                "title": title.strip(),
                "url": url.strip(),
                "source": sources[i].strip() if i < len(sources) else "",
                "date": dates[i].strip() if i < len(dates) else "",
            })
    except Exception as e:
        print(f"搜索失败: {e}")
    
    return results

def main():
    parser = argparse.ArgumentParser(description="搜狗微信搜索")
    parser.add_argument("-k", "--keyword", required=True, help="搜索关键词")
    parser.add_argument("-n", "--count", type=int, default=10, help="结果数量")
    args = parser.parse_args()
    
    print(f"🔍 搜索: {args.keyword}\n")
    results = search_wechat(args.keyword, args.count)
    
    if not results:
        print("未找到结果，请稍后重试")
        sys.exit(1)
    
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['title']}")
        print(f"   📰 {r['source']} | {r['date']}")
        print(f"   🔗 {r['url']}")
        print()

if __name__ == "__main__":
    main()
