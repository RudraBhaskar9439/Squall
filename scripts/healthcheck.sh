#!/usr/bin/env bash
# Squall healthcheck — verifies every layer in one command.
#   bash scripts/healthcheck.sh         # full: contract tests + off-chain tests + live
#   bash scripts/healthcheck.sh live    # fast: skip test suites, only live/on-chain checks
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ROOT
MODE="${1:-full}"
RC=0

echo "🌀 Squall healthcheck (${MODE})"

if [ "$MODE" != "live" ]; then
  echo
  echo "── Contract tests (Move) ──"
  if (cd "$ROOT/move/strata" && sui move test >/dev/null 2>&1); then
    echo "  ✅ move tests pass"
  else
    echo "  ❌ move tests failed"; RC=1
  fi

  echo
  echo "── Off-chain tests (sdk / sim / keeper) ──"
  if (cd "$ROOT" && pnpm -r test >/dev/null 2>&1); then
    echo "  ✅ js tests pass"
  else
    echo "  ❌ js tests failed"; RC=1
  fi
fi

echo
echo "── Live (on-chain + Walrus + app) ──"
python3 "$ROOT/scripts/livecheck.py" || RC=1

echo
if [ "$RC" -eq 0 ]; then
  echo "✅ ALL GOOD"
else
  echo "❌ SOME CHECKS FAILED"
fi
exit $RC
