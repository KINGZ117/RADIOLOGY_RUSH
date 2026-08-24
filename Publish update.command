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
export PATH="$HOME/.hermes/node/bin:$PATH"

if git push -q origin main; then
  echo "  Pushed to GitHub."
else
  echo "  GitHub push failed. Tell Claude and paste the message above."
fi

echo "  Publishing to Netlify..."
if netlify deploy --prod --dir . --message "Publish $(date '+%d %b %H:%M')" >/tmp/rr-deploy.log 2>&1; then
  echo "  LIVE: https://radiology-rush.netlify.app"
else
  echo "  Netlify publish failed — last lines:"
  tail -4 /tmp/rr-deploy.log | sed 's/^/    /'
fi
echo ""
read -n 1 -s -r -p "  Press any key to close."
