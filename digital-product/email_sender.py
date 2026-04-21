#!/usr/bin/env python3
"""
THEMACHINE CORP. | 数字产品邮件发送脚本
用法: python3 email_sender.py <收件人邮箱> [产品类型]
产品类型: ai-agent-guide (默认) | ai-agent-advanced
"""
import smtplib
import ssl
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# ── 配置 ──────────────────────────────────────────────
SMTP_SERVER = "smtp.163.com"
SMTP_PORT = 465
USERNAME = "themachinecorp@163.com"
PASSWORD = "LLq8s8KrtsJWhHAp"        # 163 授权码
FROM_EMAIL = "themachinecorp@163.com"
FROM_NAME = "THEMACHINE CORP."

# 产品配置
PRODUCTS = {
    "ai-agent-guide": {
        "name": "AI Agent 副业实战指南",
        "price": "¥299",
        "attachment": "AI-Agent-副业实战指南.pdf",
    },
}

# ── 邮件内容模板 ───────────────────────────────────────
def build_email(product_key: str, buyer_email: str) -> MIMEMultipart:
    product = PRODUCTS[product_key]
    msg = MIMEMultipart()
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = buyer_email
    msg['Subject'] = f"【{product['name']}】您的订单已完成，请查收 👇"

    html_body = f"""
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1a1a2e; padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">THEMACHINE CORP.</h1>
    </div>
    <div style="padding: 32px; background: #f9f9f9;">
        <h2 style="color: #333;">✅ 订单已完成</h2>
        <p>您好，</p>
        <p>感谢您的购买！以下是您的产品：</p>
        <div style="background: #fff; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0;">
            <strong style="font-size: 18px;">{product['name']}</strong><br/>
            <span style="color: #666;">实付金额：{product['price']}</span>
        </div>
        <p>请查收附件 PDF 文件，内含完整内容。</p>
        <p>如有疑问，回复此邮件即可。</p>
        <hr style="margin: 24px 0;"/>
        <p style="color: #888; font-size: 13px;">THEMACHINE CORP. | 用AI agent团队跑通副业闭环</p>
    </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html_body, 'html'))

    # 附加 PDF
    try:
        with open(f"products/{product['attachment']}", 'rb') as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{product["attachment"]}"')
            msg.attach(part)
    except FileNotFoundError:
        print(f"⚠ 警告: 找不到附件 products/{product['attachment']}", flush=True)

    return msg


def send_email(to_email: str, product_key: str = "ai-agent-guide") -> bool:
    msg = build_email(product_key, to_email)
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=ctx) as server:
            server.login(USERNAME, PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"✅ 邮件已发送至 {to_email}", flush=True)
        return True
    except Exception as e:
        print(f"❌ 发送失败: {e}", flush=True)
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 email_sender.py <收件人邮箱> [产品类型]")
        sys.exit(1)
    buyer = sys.argv[1]
    product = sys.argv[2] if len(sys.argv) > 2 else "ai-agent-guide"
    success = send_email(buyer, product)
    sys.exit(0 if success else 1)
