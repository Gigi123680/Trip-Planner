#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$(cat .node-bin):$PATH"
exec npm run dev -- --port 5175 --strictPort
