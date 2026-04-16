#!/usr/bin/env python3
"""
Discord通知器
用法: python3 discord_notify.py --webhook "https://discord.com/api/webhooks/xxx" --content "消息"
"""
import requests
import argparse
import sys
import os

def send_discord(webhook, content, username=None):
    """发送Discord消息"""
    webhook = webhook or os.environ.get("DISCORD_WEBHOOK")
    if not webhook:
        return False, "未设置DISCORD_WEBHOOK"
    
    data = {"content": content}
    if username:
        data["username"] = username
    
    try:
        resp = requests.post(webhook, json=data, timeout=10)
        if resp.status_code == 204:
            return True, "发送成功"
        return False, f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description="Discord通知")
    parser.add_argument("--webhook", help="Webhook URL")
    parser.add_argument("--content", required=True, help="消息内容")
    parser.add_argument("--username", help="自定义用户名")
    args = parser.parse_args()
    
    success, msg = send_discord(args.webhook, args.content, args.username)
    
    if success:
        print(f"✅ {msg}")
    else:
        print(f"❌ {msg}")
        sys.exit(1)

if __name__ == "__main__":
    main()
