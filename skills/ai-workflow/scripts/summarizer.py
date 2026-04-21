#!/usr/bin/env python3
"""
AI摘要器 - 支持DeepSeek/OpenAI
用法: python3 summarizer.py --input news.json --model deepseek
"""
import requests
import argparse
import json
import sys
import os

DEFAULT_PROMPT = "请用100字以内总结以下新闻要点："

def call_deepseek(content, api_key=None, prompt=None):
    """调用DeepSeek API"""
    key = api_key or os.environ.get("DEEPSEEK_API_KEY")
    if not key:
        return None, "未设置 DEEPSEEK_API_KEY"
    
    prompt = prompt or DEFAULT_PROMPT
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content[:4000]}
        ],
        "temperature": 0.7,
    }
    
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        result = resp.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", ""), None
    except Exception as e:
        return None, str(e)

def call_openai(content, api_key=None, prompt=None):
    """调用OpenAI API"""
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        return None, "未设置 OPENAI_API_KEY"
    
    prompt = prompt or DEFAULT_PROMPT
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content[:4000]}
        ],
        "temperature": 0.7,
    }
    
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        result = resp.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", ""), None
    except Exception as e:
        return None, str(e)

def main():
    parser = argparse.ArgumentParser(description="AI摘要器")
    parser.add_argument("--input", help="输入JSON文件")
    parser.add_argument("--text", help="或直接输入文本")
    parser.add_argument("--model", default="deepseek", choices=["deepseek", "openai"], help="模型")
    parser.add_argument("--api-key", help="API密钥（可选，环境变量优先）")
    parser.add_argument("--prompt", help="自定义提示词")
    args = parser.parse_args()
    
    # 获取内容
    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                content = "\n".join([f"- {item.get('title', '')}" for item in data])
            else:
                content = str(data)
    elif args.text:
        content = args.text
    else:
        print("请提供 --input 或 --text")
        sys.exit(1)
    
    print(f"🤖 使用 {args.model} 生成摘要...")
    
    if args.model == "deepseek":
        summary, err = call_deepseek(content, args.api_key, args.prompt)
    else:
        summary, err = call_openai(content, args.api_key, args.prompt)
    
    if err:
        print(f"❌ 错误: {err}")
        sys.exit(1)
    
    print(f"\n📝 摘要结果：\n{summary}")

if __name__ == "__main__":
    main()
