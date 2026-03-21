#!/bin/bash
# PAN v2.0 - クリーンセットアップ (Mac用)
# このスクリプトは Windows 用の依存ライブラリを Mac 用にリセットします

cd "$(dirname "$0")"

echo "========================================"
echo "  PAN v2.0 - Clean Setup for Mac"
echo "  Windows 用のキャッシュを削除し、Mac 用に再構成します"
echo "========================================"

# 1. 既存のフォルダを削除
echo " [1/3] 既存の node_modules と package-lock.json を削除中..."
rm -rf node_modules
rm -f package-lock.json

# 2. 再インストール
echo " [2/3] macOS 用のライブラリをインストール中 (数分かかることがあります)..."
npm install

if [ $? -ne 0 ]; then
    echo " [ERROR] インストールに失敗しました。ネットワークを確認してください。"
    read -p "Enterキーを押して終了..."
    exit 1
fi

echo " [3/3] セットアップ完了！"
echo ""
echo " これで start.command が正常に動くようになります。"
echo " 何かキーを押すと終了します..."
read -n 1
