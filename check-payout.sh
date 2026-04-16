#!/bin/bash
# Coolify PR #9469 payout monitor
# Checks if PR was merged and reports payout status

TOKEN="[REDACTED]"

echo "=== Coolify PR #9469 Status ==="
PR=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/coollabsio/coolify/pulls/9469")

STATE=$(echo "$PR" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('state','unknown'))")
MERGED=$(echo "$PR" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('merged','unknown'))")
HTML=$(echo "$PR" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('html_url',''))")
LABELS=$(echo "$PR" | python3 -c "import json,sys; d=json.load(sys.stdin); print(','.join([l.get('name','') for l in d.get('labels',[])]))")

echo "State: $STATE"
echo "Merged: $MERGED"
echo "Labels: $LABELS"
echo "URL: $HTML"

if [ "$STATE" = "closed" ] && [ "$MERGED" = "True" ]; then
  echo "✅ PR MERGED - payout should be processing"
elif [ "$STATE" = "closed" ] && [ "$MERGED" = "False" ]; then
  echo "❌ PR REJECTED - no payout"
else
  echo "⏳ PR still open"
fi

echo ""
echo "=== Other recent PRs ==="
curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/coollabsio/coolify/pulls?state=all&per_page=5&sort=updated" \
  | python3 -c "
import json,sys
prs=json.load(sys.stdin)
for p in prs[:5]:
    labels=','.join([l.get('name','') for l in p.get('labels',[])])
    print(f\"#{p.get('number')} [{p.get('state')}] merged={p.get('merged')} {p.get('title','')[:50]} labels={labels}\")
"
