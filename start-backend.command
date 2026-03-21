#!/bin/bash
# PAN v2.0 - Backend process
# このファイルは start.command から自動的に呼び出されます

cd "$(dirname "$0")"

echo "========================================"
echo " PAN v2.0 Backend (tsx watch)"
echo "========================================"
echo ""

# バックエンドの起動 (start-backend.bat と同等の処理)
if [ -f "./node_modules/tsx/dist/cli.mjs" ]; then
    node "./node_modules/tsx/dist/cli.mjs" watch server/index.ts
else
    echo "[ERROR] tsx not found. Run npm install first."
    sleep 5
fi
