#!/bin/bash
# Coolify PR payout monitor
# Usage: bash check-coolify-payout.sh [PR_NUMBER]

TOKEN="[REDACTED_BEFORE_PUSH]"
REPO="coollabsio/coolify"

if [ -z "$1" ]; then
  echo "Usage: bash check-coolify-payout.sh [PR_NUMBER]"
  echo "Example: bash check-coolify-payout.sh 9469"
  exit 1
fi

PR_NUM=$1

echo "=== Coolify PR #$PR_NUM ==="

DATA=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$REPO/pulls/$PR_NUM")

STATE=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('state','?'))")
MERGED=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(str(d.get('merged',False)))")
TITLE=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('title','?')[:60])")
HTML=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('html_url',''))")
LABELS=$(echo "$DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(','.join([l.get('name','') for l in d.get('labels',[])]))")

echo "Title:   $TITLE"
echo "State:   $STATE"
echo "Merged:  $MERGED"
echo "Labels:  $LABELS"
echo "URL:     $HTML"

if [ "$MERGED" = "True" ]; then
  echo ""
  echo "✅ MERGED - Algora payout should process within days"
elif [ "$STATE" = "closed" ]; then
  echo ""
  echo "❌ REJECTED - No payout (PR closed without merging)"
else
  echo ""
  echo "⏳ Still open - waiting for review"
fi
