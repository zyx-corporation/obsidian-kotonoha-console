#!/usr/bin/env bash
# Copy built plugin into dev vault (Obsidian does not load symlinks outside the vault).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="${1:-$ROOT/dev-vault}"
PLUGIN_SRC="$ROOT"
PLUGIN_DST="$VAULT/.obsidian/plugins/kotonoha-console"

mkdir -p "$VAULT/.obsidian/plugins"
mkdir -p "$VAULT/notes"

if [[ ! -f "$VAULT/notes/rde-sample.md" ]]; then
  cp "$ROOT/fixtures/sample-note.md" "$VAULT/notes/rde-sample.md"
fi

for f in main.js manifest.json styles.css; do
  if [[ ! -f "$PLUGIN_SRC/$f" ]]; then
    echo "Missing $PLUGIN_SRC/$f — run: npm run build" >&2
    exit 1
  fi
done

rm -rf "$PLUGIN_DST"
mkdir -p "$PLUGIN_DST"
cp "$PLUGIN_SRC/main.js" "$PLUGIN_SRC/manifest.json" "$PLUGIN_SRC/styles.css" "$PLUGIN_DST/"

cat <<EOF
Dev vault ready: $VAULT
Plugin copied to: $PLUGIN_DST

Obsidian:
  1. Open vault: $VAULT  (or reload if already open)
  2. Settings → Community plugins → turn OFF "Restricted mode" (初回必須)
  3. Enable "Kotonoha Console"
  4. Cmd+P → "RDE 監査を実施（アクティブノート）"

After code changes: npm run build && npm run link:dev-vault
EOF
