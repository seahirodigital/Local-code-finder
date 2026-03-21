#!/bin/bash
# PAN v2.0 - Professional Asset Nexus Frontend
# ダブルクリックで起動可能な macOS 用スクリプト (強化版)

cd "$(dirname "$0")"

echo "========================================"
echo "  PAN v2.0 - Startup for macOS"
echo "  Cleaning up old processes..."
echo "========================================"

# ポート 3000, 3001 を使用しているプロセスを終了
lsof -ti :3000,3001 | xargs kill -9 2>/dev/null

echo ""
echo "========================================"
echo "  PAN v2.0 - Starting"
echo "========================================"

# 1. node_modules の確認 (OS不整合の検出)
if [ ! -d "node_modules" ]; then
    echo " [1/3] Installing dependencies..."
    npm install
elif [ ! -d "node_modules/.bin" ]; then
    echo " [WARNING] node_modules が不完全か OS が不適合な可能性があります。"
    echo " 問題が発生した場合は clean-setup.command をお試しください。"
fi

# 2. バックエンドサーバの起動 (新しいウィンドウで)
echo " [2/3] Starting backend server (port 3001)..."
# 権限を付与しつつ起動
chmod +x ./start-backend.command ./clean-setup.command 2>/dev/null
osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)' && ./start-backend.command\""

# 3. 待機
echo " [2/3] Waiting for server..."
sleep 8

# 4. ブラウザを開く
echo " [3/3] Opening browser..."
open "http://localhost:3000"

echo ""
echo "========================================"
echo "  PAN v2.0 Running"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  ※ 動かない場合は clean-setup.command を実行してください"
echo "========================================"
echo ""

# 5. フロントエンドサーバの起動
if [ -f "./node_modules/.bin/vite" ]; then
    ./node_modules/.bin/vite --port=3000 --host=0.0.0.0
else
    # fallback to global/npx if bin is missing
    npx vite --port=3000 --host=0.0.0.0
fi
