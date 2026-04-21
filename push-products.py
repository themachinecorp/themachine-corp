#!/usr/bin/env python3
import urllib.request, urllib.error, base64, json

TOKEN = "[REDACTED_BEFORE_PUSH]"
OWNER = "themachinehf"
REPO = "themachine-corp"
REMOTE_PATH = "products.html"
LOCAL_FILE = "/home/themachine/.openclaw/workspace/themachine-corp/products.html"
COMMIT_MSG = "feat: Gumroad overlay buttons (no page redirect)"
CURRENT_SHA = "32a8568e4688cf1382029aefaec0f51828f47ae1"

url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{REMOTE_PATH}"

with open(LOCAL_FILE, 'rb') as f:
    content_b64 = base64.b64encode(f.read()).decode()

data = json.dumps({
    "message": COMMIT_MSG,
    "sha": CURRENT_SHA,
    "content": content_b64
}).encode()

req = urllib.request.Request(
    url, data=data, method="PUT",
    headers={
        "Authorization": f"token {TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "themachine-push/1.0"
    }
)

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
        commit = result.get("commit", {})
        print("SUCCESS! Commit:", commit.get("sha", "?")[:12])
except urllib.error.HTTPError as e:
    body = e.read().decode()[:300]
    print(f"HTTP {e.code}: {body}")
except Exception as e:
    print(f"Error: {e}")
