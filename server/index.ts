import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { exec } from 'child_process';
import { scanAll, readFileContent, getDirectoryTree, getPdfPath, ScannedAsset } from './scanner.js';
import { FileWatcher } from './watcher.js';

const CONFIG_PATH = path.join(process.cwd(), 'pan-config.json');
const PORT = 3001;

// OSごとのパスの違いを吸収する関数（Windows <-> Mac）
function getCrossPlatformPath(p: string): string {
  let normalized = p.replace(/\\/g, '/');
  const isMac = process.platform === 'darwin';

  if (isMac) {
    // WindowsのパスをMac用に変換
    if (normalized.match(/^[A-Za-z]:\/Users\/HCY\/OneDrive/i)) {
      normalized = normalized.replace(/^[A-Za-z]:\/Users\/HCY\/OneDrive/i, '/Users/user/Library/CloudStorage/OneDrive-個人用');
    } else if (normalized.match(/^[A-Za-z]:\/Users\/HCY/i)) {
      normalized = normalized.replace(/^[A-Za-z]:\/Users\/HCY/i, '/Users/user');
    }
  } else {
    // MacのパスをWindows用に変換
    if (normalized.startsWith('/Users/user/Library/CloudStorage/OneDrive-個人用')) {
      normalized = normalized.replace('/Users/user/Library/CloudStorage/OneDrive-個人用', 'C:/Users/HCY/OneDrive');
    } else if (normalized.startsWith('/Users/user')) {
      normalized = normalized.replace('/Users/user', 'C:/Users/HCY');
    }
  }
  return path.normalize(normalized);
}

// 設定読み込み
function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    if (config.watchPaths && Array.isArray(config.watchPaths)) {
      config.watchPaths = config.watchPaths.map((p: string) => getCrossPlatformPath(p));
    }
    return config;
  } catch {
    const defaultConfig = {
      watchPaths: [],
      ignoredPatterns: ['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build', '.next', '.cache', 'coverage'],
      maxDepth: 5,
      maxFileSize: 1048576,
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

// 設定保存
function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// アセットキャッシュ
let cachedAssets: ScannedAsset[] = [];
let lastScanTime = 0;

function refreshAssets() {
  const config = loadConfig();
  cachedAssets = scanAll(config);
  lastScanTime = Date.now();
  return cachedAssets;
}

// Express アプリ
const app = express();
app.use(cors());
app.use(express.json());

// HTTP + WebSocket サーバー
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket接続管理
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`WebSocketクライアント接続 (合計: ${clients.size})`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`WebSocketクライアント切断 (合計: ${clients.size})`);
  });
});

function broadcast(data: any) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// ファイルウォッチャー初期化
const config = loadConfig();
const watcher = new FileWatcher(config.ignoredPatterns);

// ファイル変更時にスキャンして通知（デバウンス付き）
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watcher.onEvent((event) => {
  console.log(`ファイルイベント: ${event.type} - ${event.filePath}`);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    refreshAssets();
    broadcast({ type: 'assets_updated', assets: cachedAssets, timestamp: Date.now() });
  }, 1000);
});

// 初期スキャン＆監視開始
refreshAssets();
for (const watchPath of config.watchPaths) {
  watcher.watch(watchPath);
}

// === API ルート ===

// 全アセット取得
app.get('/api/assets', (_req, res) => {
  // 5秒以上古ければ再スキャン
  if (Date.now() - lastScanTime > 5000) {
    refreshAssets();
  }
  res.json({ assets: cachedAssets, timestamp: lastScanTime });
});

// 手動スキャンをトリガー
app.post('/api/scan', (_req, res) => {
  refreshAssets();
  broadcast({ type: 'assets_updated', assets: cachedAssets, timestamp: Date.now() });
  res.json({ success: true, count: cachedAssets.length });
});

// ファイル内容を取得
app.get('/api/assets/content', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).json({ error: 'pathパラメータが必要です' });
  }
  const content = readFileContent(filePath);
  if (content === null) {
    return res.status(404).json({ error: 'ファイルが見つかりません' });
  }
  res.json({ content, path: filePath });
});

// ディレクトリツリーを取得
app.get('/api/tree', (req, res) => {
  const dirPath = req.query.path as string;
  const depth = parseInt(req.query.depth as string) || 3;
  if (!dirPath) {
    return res.status(400).json({ error: 'pathパラメータが必要です' });
  }
  const tree = getDirectoryTree(dirPath, depth);
  res.json({ tree, path: dirPath });
});

// 監視パス一覧を取得
app.get('/api/paths', (_req, res) => {
  const config = loadConfig();
  res.json({ paths: config.watchPaths });
});

// 監視パスを追加
app.post('/api/paths', (req, res) => {
  const { path: newPath } = req.body;
  if (!newPath) {
    return res.status(400).json({ error: 'pathが必要です' });
  }

  const normalizedPath = path.normalize(newPath);

  // パスの存在チェック
  if (!fs.existsSync(normalizedPath)) {
    return res.status(400).json({ error: `パスが存在しません: ${normalizedPath}` });
  }

  const config = loadConfig();

  // 重複チェック
  if (config.watchPaths.some((p: string) => path.normalize(p) === normalizedPath)) {
    return res.status(409).json({ error: '既に登録されています' });
  }

  config.watchPaths.push(normalizedPath);
  saveConfig(config);

  // 監視開始＆スキャン
  watcher.watch(normalizedPath);
  refreshAssets();
  broadcast({ type: 'assets_updated', assets: cachedAssets, timestamp: Date.now() });
  broadcast({ type: 'paths_updated', paths: config.watchPaths });

  res.json({ success: true, paths: config.watchPaths });
});

// 監視パスを削除
app.delete('/api/paths', (req, res) => {
  const { path: removePath } = req.body;
  if (!removePath) {
    return res.status(400).json({ error: 'pathが必要です' });
  }

  const normalizedPath = path.normalize(removePath);
  const config = loadConfig();

  config.watchPaths = config.watchPaths.filter(
    (p: string) => path.normalize(p) !== normalizedPath
  );
  saveConfig(config);

  // 監視停止＆スキャン
  res.json({ success: true, paths: config.watchPaths });
});

// ファイル内検索API
app.get('/api/search', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  if (!query || query.length < 2) {
    return res.json({ paths: [] });
  }

  const resultPaths = new Set<string>();
  const textExts = new Set(['.md', '.txt', '.py', '.js', '.ts', '.jsx', '.tsx', '.gs', '.json', '.html', '.css', '.csv']);
  const skipDirs = new Set(['node_modules', '__pycache__', '.git', 'dist', 'build', '.next', '.cache', 'coverage', '.venv', 'env', 'venv']);
  
  function searchDir(dir: string, depth: number) {
    if (depth > 6) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue;
        const fp = path.join(dir, entry.name);
        
        let match = false;
        
        // ファイル名マッチ
        if (entry.name.toLowerCase().includes(query)) match = true;

        if (entry.isFile()) {
            if (!match && textExts.has(path.extname(entry.name).toLowerCase())) {
                try {
                    const content = fs.readFileSync(fp, 'utf-8').toLowerCase();
                    if (content.includes(query)) match = true;
                } catch {}
            }
            if (match) {
                resultPaths.add(fp.replace(/\\/g, '/')); // 一致したファイルパス
                resultPaths.add(dir.replace(/\\/g, '/')); // 親ディレクトリパス
            }
        } else if (entry.isDirectory()) {
            if (match) resultPaths.add(fp.replace(/\\/g, '/'));
            searchDir(fp, depth + 1);
        }
      }
    } catch {}
  }

  // watchPathsすべてを検索
  const config = loadConfig();
  for (const p of config.watchPaths) {
     searchDir(p, 1);
  }

  res.json({ paths: Array.from(resultPaths) });
});

// フォルダをエクスプローラーで開く
app.post('/api/reveal', (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) {
    return res.status(400).json({ error: 'pathが必要です' });
  }

  const normalizedPath = path.normalize(targetPath);
  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ error: 'パスが存在しません' });
  }

  // Windows: explorer, macOS: open, Linux: xdg-open
  const platform = process.platform;
  let command: string;

  if (platform === 'win32') {
    const stat = fs.statSync(normalizedPath);
    if (stat.isDirectory()) {
      command = `explorer "${normalizedPath}"`;
    } else {
      command = `explorer /select,"${normalizedPath}"`;
    }
  } else if (platform === 'darwin') {
    command = `open -R "${normalizedPath}"`;
  } else {
    command = `xdg-open "${path.dirname(normalizedPath)}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error('エクスプローラー起動エラー:', error);
      return res.status(500).json({ error: 'フォルダを開けませんでした' });
    }
    res.json({ success: true });
  });
});

// ファイルを既定のアプリケーションで開く（PDFなど）
app.post('/api/open', (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) {
    return res.status(400).json({ error: 'pathが必要です' });
  }

  const normalizedPath = path.normalize(targetPath);
  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ error: 'パスが存在しません' });
  }

  const platform = process.platform;
  let command: string;

  if (platform === 'win32') {
    // start "" "C:\path\to\file" の構文
    command = `start "" "${normalizedPath}"`;
  } else if (platform === 'darwin') {
    command = `open "${normalizedPath}"`;
  } else {
    command = `xdg-open "${normalizedPath}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error('ファイル起動エラー:', error);
      return res.status(500).json({ error: 'ファイルを開けませんでした' });
    }
    res.json({ success: true });
  });
});

// PDF配信
app.get('/api/pdf', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'pathが必要です' });
  const pdfPath = getPdfPath(filePath);
  if (!pdfPath) return res.status(404).json({ error: 'PDFが見つかりません' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(pdfPath).pipe(res);
});

// Python実行
app.post('/api/execute', (req, res) => {
  const { path: scriptPath } = req.body;
  if (!scriptPath) {
    return res.status(400).json({ error: 'pathが必要です' });
  }

  const normalizedPath = path.normalize(scriptPath);
  if (!fs.existsSync(normalizedPath) || !normalizedPath.endsWith('.py')) {
    return res.status(400).json({ error: '有効なPythonスクリプトではありません' });
  }

  exec(`python "${normalizedPath}"`, { timeout: 30000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error?.message || null,
    });
  });
});

// サーバー起動
server.listen(PORT, () => {
  console.log(`\n  PAN v2.0 バックエンドサーバー起動`);
  console.log(`  API: http://localhost:${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}`);
  console.log(`  監視パス: ${config.watchPaths.length}件`);
  console.log(`  検出アセット: ${cachedAssets.length}件\n`);
});

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  console.log('\nシャットダウン中...');
  await watcher.close();
  server.close();
  process.exit(0);
});
