# PAN v2.0 - Professional Asset Nexus

ローカルの開発資産（Python, GAS, Chrome拡張, n8n, Markdown等）を自動スキャンし、
Material Design 3ベースのダッシュボードで一覧・閲覧・実行できるパーソナル・ローンチパッド。

---

## 概要

### 目的
- 手動登録を完全排除。指定フォルダ内のファイルを自動検知しカタログ化
- フォルダにファイルを保存した瞬間に、UI側へ自動陳列（リアルタイム反映）
- 検索から2クリック以内で「コード閲覧」「フォルダ展開」「スクリプト実行」を完結

### 主要機能
- 指定フォルダの自動スキャン＆カテゴリ判定
- chokidar + WebSocketによるリアルタイムファイル監視
- シンタックスハイライト付きインラインコードビューワー
- HTML上からの監視パス追加・削除
- ワンクリックでエクスプローラー（Finder）を開く
- Pythonスクリプトのその場実行＆結果表示
- Dark/Lightテーマ切替
- 曖昧検索＆カテゴリフィルタ

---

## クイックスタート

### 必須環境
- **Node.js** v18以上
- **npm**（Node.jsに同梱）

### ダブルクリックで起動（推奨）

| OS | ファイル | 説明 |
|----|---------|------|
| Windows | `start.bat` | バックエンド・フロントエンド・ブラウザが自動起動 |
| Mac | `start.command` | 同上（初回は `clean-setup.command` を先に実行） |

初回実行時は `npm install` も自動実行されます。

### コマンドから起動

```bash
# 初回のみ
npm install

# サーバー + フロントエンド同時起動
npm start

# または個別に起動
npm run server   # バックエンド (port 3001)
npm run dev      # フロントエンド (port 3000)
```

起動後、ブラウザで `http://localhost:3000` を開きます。

---

## ディレクトリ構成

```
%USERPROFILE%\OneDrive\開発\Local-code-finder\
│
├── server/                     # バックエンド（Express + WebSocket）
│   ├── index.ts                #   APIサーバー本体（ルーティング・WS・監視起動）
│   ├── scanner.ts              #   ファイルスキャン＆カテゴリ自動判定ロジック
│   └── watcher.ts              #   chokidarによるリアルタイムファイル監視
│
├── src/                        # フロントエンド（React + Tailwind CSS）
│   ├── main.tsx                #   Reactエントリーポイント
│   ├── App.tsx                 #   メインUIコンポーネント（全画面構成）
│   ├── types.ts                #   TypeScript型定義
│   └── index.css               #   Tailwind CSS + Dark/Lightテーマ定義
│
├── node_modules/               # → C:\node_modules_store\local-code-finder\node_modules（ジャンクション）
│                               #   実体はOneDrive外に配置。同期・肥大化を防止
│
├── start.bat                   # Windows用 起動スクリプト（ダブルクリック）
├── start-backend.bat           # Windows用 バックエンド起動（start.batから呼ばれる）
├── start.command               # Mac用 起動スクリプト（ダブルクリック）
├── start-backend.command       # Mac用 バックエンド起動（start.commandから呼ばれる）
├── clean-setup.command         # Mac用 クリーンセットアップ（node_modules再構築）
│
├── pan-config.json             # 監視パス・設定（自動生成・UI管理）
├── package.json                # npm設定・スクリプト定義
├── package-lock.json           # npm依存関係ロックファイル
├── vite.config.ts              # Viteビルド設定（APIプロキシ含む）
├── tsconfig.json               # TypeScript設定
├── index.html                  # エントリーHTML
├── .gitignore                  # Git除外設定
└── README.md                   # このファイル
```

### node_modules の配置について

`node_modules` はOneDrive同期とGitHubアップロードを防ぐため、OneDrive外にジャンクションで配置しています。

| 項目 | パス |
|------|------|
| 実体 | `C:\node_modules_store\local-code-finder\node_modules\` |
| リンク | プロジェクト内の `node_modules/`（ジャンクション） |

スクリプトからは通常通り `node_modules` を参照でき、動作に影響はありません。
他のプロジェクトでも同様に `C:\node_modules_store\<プロジェクト名>\` に配置可能です。

---

## アーキテクチャ

### 全体フロー

```
[ローカルフォルダ群]
        │
        │  chokidar（ファイル監視）
        ▼
┌─────────────────────────────┐
│  server/index.ts            │   Express (port 3001)
│  ├─ scanner.ts  (スキャン)   │   REST API + WebSocket
│  └─ watcher.ts  (監視)      │
└──────────┬──────────────────┘
           │  WebSocket (リアルタイム通知)
           │  REST API  (データ取得・操作)
           ▼
┌─────────────────────────────┐
│  src/App.tsx                │   React (port 3000)
│  フロントエンド UI            │   Vite HMR開発サーバー
└─────────────────────────────┘
           │
           ▼
       [ブラウザ]
```

### バックエンド (server/)

| ファイル | 役割 |
|----------|------|
| `index.ts` | Expressサーバー本体。APIルーティング、WebSocket管理、設定ファイル読み書き、エクスプローラー起動、Python実行 |
| `scanner.ts` | 指定ディレクトリを再帰スキャン。ファイル拡張子やフォルダ内容からカテゴリを自動判定。READMEから説明文を自動抽出 |
| `watcher.ts` | chokidarラッパー。ファイルの作成・変更・削除イベントを検知し、コールバックで通知 |

### フロントエンド (src/)

| ファイル | 役割 |
|----------|------|
| `App.tsx` | 全UIコンポーネント。サイドバー、ヘッダー、カテゴリタブ、アセットカード、コードビューワー、パス管理モーダル、実行結果モーダル |
| `types.ts` | Asset、AssetCategoryの型定義 |
| `index.css` | Tailwind CSS v4テーマ。Material Design 3カラーパレット、Dark/Light両対応 |

---

## API仕様

バックエンドは `http://localhost:3001` で以下のAPIを提供します。

### REST API

| メソッド | エンドポイント | 説明 |
|----------|--------------|------|
| `GET` | `/api/assets` | 全アセット一覧を取得 |
| `POST` | `/api/scan` | 手動で再スキャンをトリガー |
| `GET` | `/api/assets/content?path=...` | 指定ファイルの中身を取得 |
| `GET` | `/api/tree?path=...&depth=3` | ディレクトリツリーを取得 |
| `GET` | `/api/paths` | 監視パス一覧を取得 |
| `POST` | `/api/paths` | 監視パスを追加（body: `{ "path": "..." }`） |
| `DELETE` | `/api/paths` | 監視パスを削除（body: `{ "path": "..." }`） |
| `POST` | `/api/reveal` | エクスプローラーでフォルダを開く（body: `{ "path": "..." }`） |
| `POST` | `/api/execute` | Pythonスクリプトを実行（body: `{ "path": "..." }`） |

### WebSocket

`ws://localhost:3001` に接続すると、以下のイベントがリアルタイムで配信されます。

| イベント | タイミング | データ |
|----------|-----------|--------|
| `assets_updated` | ファイル変更検知後（1秒デバウンス） | `{ type, assets, timestamp }` |
| `paths_updated` | 監視パス追加・削除時 | `{ type, paths }` |

---

## カテゴリ自動判定ロジック

### ファイル単体

| 拡張子 | カテゴリ |
|--------|---------|
| `.py` | Python |
| `.gs` | GAS |
| `.md`, `.mdx` | Markdown |
| `.js`, `.ts`, `.jsx`, `.tsx` | Other |
| `.json` | Other |

### ディレクトリ（優先順位順）

| 条件 | カテゴリ |
|------|---------|
| `manifest.json` + `manifest_version` キー | Chrome Extension |
| `workflow*.json` または `n8n` 含むファイル | n8n |
| `.gs` ファイルまたは `appsscript.json` | GAS |
| `.py` ファイルまたは `requirements.txt` / `pyproject.toml` | Python |
| `.md` ファイルが存在 | Markdown |
| 上記いずれにも該当しない | Other |

---

## 設定ファイル (pan-config.json)

UI上で監視パスを追加・削除すると、このファイルが自動更新されます。
手動編集も可能です。

```json
{
  "watchPaths": [
    "C:\\Users\\HCY\\.gemini\\antigravity\\global_skills",
    "C:\\Users\\HCY\\OneDrive\\開発",
    "C:\\Users\\HCY\\OneDrive\\投資"
  ],
  "ignoredPatterns": [
    "node_modules", ".git", "__pycache__", ".venv",
    "dist", "build", ".next", ".cache", "coverage"
  ],
  "maxDepth": 5,
  "maxFileSize": 1048576
}
```

| キー | 説明 |
|------|------|
| `watchPaths` | 監視対象のルートディレクトリ一覧 |
| `ignoredPatterns` | スキャン除外するフォルダ名 |
| `maxDepth` | 再帰スキャンの最大深度 |
| `maxFileSize` | ビューワーで表示可能なファイルサイズ上限（バイト） |

---

## UI構成

### グローバルナビゲーション（左端スリムバー）

| アイコン | フィルタ |
|----------|---------|
| LayoutDashboard | すべて |
| Terminal | Python |
| Code2 | GAS |
| Puzzle | Chrome拡張 |
| BookOpen | ドキュメント (Markdown) |
| Share2 | n8n |
| Settings | 監視パス管理モーダルを開く |

### アセットカードの3大アクション

| ボタン | アイコン | 動作 |
|--------|---------|------|
| Viewer | Eye | その場でコード・READMEの中身を表示（外部エディタ不要） |
| Reveal | FolderSearch | 保存先ディレクトリをエクスプローラーで直接開く |
| Execute | Zap | Pythonスクリプトをその場で実行（結果をモーダル表示） |

### コードビューワー

- 右スライドパネル（最大700px幅）
- ディレクトリの場合はツリーパネル付き（左側にファイルツリー表示）
- シンタックスハイライト対応（Python, JavaScript, TypeScript, JSON, Markdown）
- 行番号表示
- クリップボードコピー機能

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|----------|------|-----------|
| フロントエンド | React | 19 |
| UIフレームワーク | Tailwind CSS | 4.x |
| ビルドツール | Vite | 6.x |
| アイコン | Lucide React | 0.546 |
| アニメーション | Motion (Framer Motion) | 12.x |
| バックエンド | Express | 4.x |
| ファイル監視 | chokidar | 5.x |
| WebSocket | ws | 8.x |
| TypeScript実行 | tsx | 4.x |
| 言語 | TypeScript | 5.8 |

---

## npmスクリプト

| コマンド | 説明 |
|----------|------|
| `npm start` | バックエンド + フロントエンドを同時起動 |
| `npm run server` | バックエンドのみ起動 (port 3001) |
| `npm run dev` | フロントエンドのみ起動 (port 3000) |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果をプレビュー |
| `npm run lint` | TypeScript型チェック |

---

## デザインシステム

Google Material Design 3に基づき、以下のカラーパレットを採用。

### Dark Theme

| トークン | 色 | 用途 |
|----------|-----|------|
| `primary` | `#67d9c9` | メインアクセント、アクティブ要素 |
| `secondary` | `#bac3ff` | Python系ハイライト、コード構文 |
| `tertiary` | `#ffb784` | GAS系ハイライト、文字列ハイライト |
| `error` | `#ffb4ab` | エラー表示、n8nカテゴリ |
| `background` | `#0b1326` | メイン背景 |
| `on-surface` | `#dae2fd` | テキスト |

### Light Theme

| トークン | 色 | 用途 |
|----------|-----|------|
| `primary` | `#00897b` | メインアクセント |
| `secondary` | `#4a5bbd` | セカンダリ |
| `background` | `#f8fafb` | メイン背景 |
| `on-surface` | `#1a1c1e` | テキスト |

フォント: Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（コード）
アイコン: Lucide Icons（絵文字不使用）
