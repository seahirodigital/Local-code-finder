#!/bin/bash
# PAN v2.0 - Backend process
# このファイルは start.command から自動的に呼び出されます

cd "$(dirname "$0")"

echo "========================================"
echo " PAN v2.0 Backend (tsx watch)"
echo "========================================"
echo ""

# バックエンドの起動 (start-backend.bat と同等の処理)
if [ -f "./node_modules/.bin/tsx" ]; then
    "./node_modules/.bin/tsx" watch server/index.ts
else
    # fallback if bin is missing
    npx tsx watch server/index.ts
fi
