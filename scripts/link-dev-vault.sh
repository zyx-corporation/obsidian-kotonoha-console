#!/usr/bin/env bash
# Symlink plugin into dev vault for Obsidian manual testing.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="${1:-$ROOT/dev-vault}"
PLUGIN_SRC="$ROOT"
PLUGIN_DST="$VAULT/.obsidian/plugins/kotonoha-console"

mkdir -p "$VAULT/.obsidian/plugins"
mkdir -p "$VAULT/notes"

# Sample note for RDE audit
if [[ ! -f "$VAULT/notes/rde-sample.md" ]]; then
  cp "$ROOT/fixtures/sample-note.md" "$VAULT/notes/rde-sample.md"
fi

# Required plugin files
for f in main.js manifest.json styles.css; do
  if [[ ! -f "$PLUGIN_SRC/$f" ]]; then
    echo "Missing $PLUGIN_SRC/$f — run npm run build first" >&2
    exit 1
  fi
done

if [[ -L "$PLUGIN_DST" || -d "$PLUGIN_DST" ]]; then
  rm -rf "$PLUGIN_DST"
fi
ln -s "$PLUGIN_SRC" "$PLUGIN_DST"

cat <<EOF
Dev vault ready: $VAULT

Obsidian: Open folder as vault → $VAULT

Manual RDE audit:
  1. Enable "Kotonoha Console" in Settings → Community plugins
  2. Settings → Kotonoha Console → Backend: mock, sidecarMode: on
  3. Open notes/rde-sample.md
  4. Command palette → "RDE 監査を実施（アクティブノート）"
  5. Check .kotonoha/audit/ under vault root

Rebuild after code changes: npm run build (symlink picks up main.js)
EOF
