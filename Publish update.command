#!/bin/bash
# Double-click to publish whatever has changed to GitHub. Netlify redeploys itself.
cd "$(dirname "$0")" || exit 1

echo ""
echo "  PUBLISHING RADIOLOGY RUSH"
echo "  ──────────────────────────────────────────"

if [ -z "$(git status --porcelain)" ]; then
  echo "  Nothing has changed since the last publish."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
  exit 0
fi

echo "  Changed:"
git status --porcelain | sed 's/^/    /'
echo ""

git add -A
git commit -q -m "Update ${1:-$(date '+%d %b %Y, %H:%M')}"
if git push -q origin main; then
  echo "  Pushed. Netlify is rebuilding — live in about a minute."
else
  echo "  Push failed. Tell Claude and paste the message above."
fi
echo ""
read -n 1 -s -r -p "  Press any key to close."
