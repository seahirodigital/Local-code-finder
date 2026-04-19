# Local Code Finder

## Use Cases & Search Tags
- 「ローカルのコードファイルを検索するツール」
- 「Win/Macの両方で動く開発ツール」
- 「OS跨ぎエラーを回避する設計のローカルアプリ」
- 「pan-config.jsonで設定を管理するコード検索」

本プロジェクトは、WindowsとMacでのOS跨ぎのエラーを防ぐため、以下の運用仕様となっています。

## 実行環境の仕様 (Windows / Mac)
* **Windows側**: OneDriveでソースコードを管理し、実行します。(`start.bat` 等を利用)
* **Mac側**: `~/Local-code-finder` などの物理的なローカル領域へ手動でディレクトリをコピーし、そちらで実行します。(`start.command` 等を利用)

**※なぜこの設計なのか**
OneDriveを経由して `node_modules` や環境設定を同期してしまうと、WindowsとMacのCPUアーキテクチャ（x86_64とARM等）の差異によるネイティブバイナリエラーが頻発します。
加えて大量のファイルをOneDriveで同期することでPCリソースを著しく圧迫するため、コードと設定（`pan-config.json`等）のみを共有し、実行環境自体はOS別で独立させています。

## 設定ファイル (`pan-config.json`) の共有について
`pan-config.json` 自体はUIを介して更新されるため、実質的に各環境に設定が適用されますが、ファイル自体は完全に独立したローカル状態を保つようになっています。
誤ってJSON設定ファイル側にコメントや不要な構造を混入させないようにするため、本仕様はこちらの `readme.md` に記載しています。
