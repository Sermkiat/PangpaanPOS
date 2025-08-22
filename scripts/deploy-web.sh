#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "prod" && "$MODE" != "dev" ]]; then
  echo "usage: $0 [prod|dev]"
  exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../web/public" && pwd)"
if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: web/public not found at $SRC_DIR"
  exit 2
fi

if [[ "$MODE" == "prod" ]]; then
  DEST="/mnt/webapp/pangpaan-pos"
  PING_URL="http://127.0.0.1:8888/__ping"
else
  DEST="/mnt/webapp/pangpaan-pos-dev"
  PING_URL="http://127.0.0.1:8085/__ping"
fi

echo "Sync $SRC_DIR -> $DEST"
mkdir -p "$DEST"
rsync -av --delete "$SRC_DIR"/ "$DEST"/

echo "Healthcheck: $PING_URL"
for i in {1..20}; do
  if curl -fsS "$PING_URL" >/dev/null; then
    echo "OK"
    exit 0
  fi
  sleep 1
done

echo "ERROR: healthcheck failed"
exit 3
