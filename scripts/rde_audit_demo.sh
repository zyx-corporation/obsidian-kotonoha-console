#!/usr/bin/env bash
# Headless RDE audit demo — mock source review + optional kotonoha CLI validate.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== RDE audit demo (obsidian-kotonoha-console) ==="
echo ""

echo "--- 1. Mock source review (performRdeAudit) ---"
DEMO_WRITE=1 npm test -- tests/rdeAuditAcceptance.test.ts --reporter=verbose 2>&1 | tail -20

echo ""
echo "--- Report (fixtures/demo-output/rde-audit-report.md) ---"
head -40 fixtures/demo-output/rde-audit-report.md 2>/dev/null || true

KO="${KOTONOHA_BIN:-}"
if [[ -z "$KO" ]]; then
  for candidate in \
    "$ROOT/../kotonoha-cli/target/release/kotonoha" \
    "$ROOT/../kotonoha-cli/target/debug/kotonoha"; do
    if [[ -x "$candidate" ]]; then KO="$candidate"; break; fi
  done
fi

echo ""
echo "--- 2. kotonoha CLI rde emit + validate (optional) ---"
if [[ -n "$KO" && -x "$KO" ]]; then
  "$KO" version
  "$KO" rde emit | "$KO" rde validate --strict
  echo "CLI interchange: OK"
else
  echo "kotonoha not found — set KOTONOHA_BIN or build kotonoha-cli"
fi

echo ""
echo "--- Sidecar preview ---"
ls -la fixtures/demo-output/.kotonoha/audit/ 2>/dev/null || true
echo ""
echo "Obsidian: コマンド「RDE 監査を実施（アクティブノート）」または Console の「RDE 監査を実施」"
