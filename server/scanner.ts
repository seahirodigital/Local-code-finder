import fs from 'fs';
import path from 'path';

// タブ用タグ（技術分類）
export type AssetTag = 'Code' | 'GAS' | 'Chrome Extension' | 'Markdown' | 'Skill' | 'n8n' | 'Other';

// サイドバー用ドメイン（業務分類）
export type AssetDomain = 'Business' | 'Investment' | 'Engineer' | 'GeneralAffairs' | 'Other';

export interface ScannedAsset {
  id: string;
  title: string;
  description: string;
  tags: AssetTag[];
  domain: AssetDomain;
  filePath: string;
  dirPath: string;
  lastModified: string;
  size: number;
  status: 'active' | 'scanning' | 'error';
  language: string;
  isDirectory: boolean;
  rootPath: string;
  executable: boolean;
}

interface ScanConfig {
  watchPaths: string[];
  ignoredPatterns: string[];
  maxDepth: number;
  maxFileSize: number;
}

// === ドメイン判定（サイドバー用） ===
function inferDomain(filePath: string): AssetDomain {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  // 経費精算 → 総務
  if (normalized.includes('経費') || normalized.includes('精算') || normalized.includes('総務') ||
      normalized.includes('expense') || normalized.includes('accounting')) {
    return 'GeneralAffairs';
  }

  // 事業開発スキル配下
  if (normalized.includes('事業開発スキル') || normalized.includes('/事業/')) {
    // finance / investor は投資ドメイン
    if (normalized.includes('/finance/') || normalized.includes('/investor/')) {
      return 'Investment';
    }
    return 'Business';
  }

  // 投資フォルダ
  if (normalized.includes('/投資/') || normalized.includes('/投資')) {
    return 'Investment';
  }

  // その他はエンジニア
  return 'Engineer';
}

// === タグ判定（タブ用） ===
function hasSkillMd(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, 'SKILL.md')) || fs.existsSync(path.join(dirPath, 'skill.md'));
}

// "Google Apps Script" フォルダ配下は全てGAS
function isUnderGASFolder(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  // パス自体が "Google Apps Script" で終わるか、配下にいるか
  return normalized.includes('/google apps script/') || normalized.endsWith('/google apps script');
}

function inferTagsForDirectory(dirPath: string, rootPath: string): { tags: AssetTag[]; language: string } {
  const tags = new Set<AssetTag>();
  let primaryLang = 'text';

  // Google Apps Script フォルダ配下は全てGAS
  if (isUnderGASFolder(dirPath)) {
    tags.add('GAS');
    primaryLang = 'javascript';
  }

  // SKILL.md持ちはスキル
  if (hasSkillMd(dirPath)) {
    tags.add('Skill');
    primaryLang = 'markdown'; // 優先度高め
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let fileNames = entries.map(e => e.name);

    if (fileNames.includes('manifest.json')) {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(dirPath, 'manifest.json'), 'utf-8'));
        if (manifest.manifest_version) { tags.add('Chrome Extension'); primaryLang = 'json'; }
      } catch {}
    }

    if (fileNames.some(f => f.includes('workflow') && f.endsWith('.json')) || fileNames.some(f => f.includes('n8n'))) {
      tags.add('n8n'); primaryLang = 'json';
    }

    if (fileNames.some(f => f.endsWith('.gs')) || fileNames.includes('appsscript.json')) {
      tags.add('GAS'); primaryLang = 'javascript';
    }

    // ディレクトリの中身を少し深く（2階層まで）見て Code かどうか判定する
    let hasPython = false;
    let hasTSJS = false;
    let hasMarkdown = false;

    function checkFiles(c_entries: fs.Dirent[], c_dir: string, depth: number) {
        let fNames = c_entries.map(e => e.name);
        if (fNames.some(f => f.endsWith('.py') || f.endsWith('.go') || f.endsWith('.rs') || f.endsWith('.java')) || fNames.includes('requirements.txt') || fNames.includes('pyproject.toml') || fNames.includes('Gemfile')) hasPython = true;
        if (fNames.some(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')) || fNames.includes('package.json') || fNames.includes('tsconfig.json')) hasTSJS = true;
        if (fNames.some(f => f.endsWith('.md'))) hasMarkdown = true;

        if (depth > 1) return;
        for (const e of c_entries) {
            if (e.isDirectory() && !['node_modules', '.git', '__pycache__', '.venv', 'env', 'venv', 'dist'].includes(e.name)) {
                try {
                    const subEntries = fs.readdirSync(path.join(c_dir, e.name), { withFileTypes: true });
                    checkFiles(subEntries, path.join(c_dir, e.name), depth + 1);
                } catch {}
            }
        }
    }

    checkFiles(entries, dirPath, 1);

    if (hasPython) { tags.add('Code'); primaryLang = 'python'; }
    if (hasTSJS) { tags.add('Code'); if (primaryLang === 'text') primaryLang = 'typescript'; }
    if (hasMarkdown) { tags.add('Markdown'); if (primaryLang === 'text') primaryLang = 'markdown'; }

  } catch {}

  if (tags.size === 0) tags.add('Other');
  
  return { tags: Array.from(tags), language: primaryLang };
}

function inferTagForFile(filePath: string): { tags: AssetTag[]; language: string } | null {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  // Google Apps Script フォルダ配下は全てGAS
  if (isUnderGASFolder(filePath)) {
    return { tags: ['GAS'], language: 'javascript' };
  }

  if (basename === 'skill.md') {
    return { tags: ['Skill'], language: 'markdown' };
  }

  switch (ext) {
    case '.py': return { tags: ['Code'], language: 'python' };
    case '.gs': return { tags: ['GAS'], language: 'javascript' };
    case '.md': case '.mdx': return { tags: ['Markdown'], language: 'markdown' };
    case '.js': case '.ts': case '.jsx': case '.tsx':
      return { tags: ['Code'], language: ext.replace('.', '') };
    case '.json': return { tags: ['Other'], language: 'json' };
    case '.html': case '.css':
      return { tags: ['Other'], language: ext.replace('.', '') };
    case '.pdf': return { tags: ['Other'], language: 'pdf' };
    default: return null;
  }
}

// === 実行可能判定 ===
function isExecutable(filePath: string, isDirectory: boolean): boolean {
  if (isDirectory) {
    try {
      const entries = fs.readdirSync(filePath);
      return entries.some(e => e.endsWith('.py') || e.endsWith('.sh') || e.endsWith('.bat'));
    } catch { return false; }
  }
  const ext = path.extname(filePath).toLowerCase();
  return ['.py', '.sh', '.bat', '.ps1'].includes(ext);
}

// === 説明文生成 ===
// extractContentKeywords はペイロード過大のため削除し、検索はAPIで行うことにする

// === ユーティリティ ===
function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  if (h < 24) return `${h}時間前`;
  if (d < 30) return `${d}日前`;
  return date.toLocaleDateString('ja-JP');
}

function generateId(filePath: string): string {
  return Buffer.from(filePath).toString('base64url');
}

// 除外拡張子
const SKIP_EXTS = new Set([
  '.jpeg', '.jpg', '.png', '.gif', '.svg', '.ico', '.webp',
  '.mp4', '.mp3', '.wav', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
  '.lock', '.log',
]);

// === スキャン ===
export function scanDirectory(rootPath: string, config: ScanConfig, currentDepth: number = 1): ScannedAsset[] {
  const assets: ScannedAsset[] = [];
  const normalizedRoot = path.normalize(rootPath);

  if (!fs.existsSync(normalizedRoot)) {
    console.warn(`パスが存在しません: ${normalizedRoot}`);
    return assets;
  }

  try {
    const entries = fs.readdirSync(normalizedRoot, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(normalizedRoot, entry.name);

      // 除外パターン
      if (config.ignoredPatterns.some(p => entry.name === p || entry.name.startsWith('.'))) continue;

      // 画像・バイナリ除外（PDF は除外しない）
      if (!entry.isDirectory()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SKIP_EXTS.has(ext)) continue;
      }

      try {
        const stat = fs.statSync(fullPath);
        const isDir = entry.isDirectory();

        // GASプロジェクト配下の個別ファイルはスキップ（ディレクトリのみ表示するため）
        if (!isDir && isUnderGASFolder(fullPath)) continue;

        // 複数タグ対応と生成
        let tags: AssetTag[];
        let language: string;
        let description: string = '';

        if (isDir) {
          const result = inferTagsForDirectory(fullPath, normalizedRoot);
          tags = result.tags;
          language = result.language;
          // 説明文は省略（フロントでもう少し汎用的になにか表示する）
        } else {
          const result = inferTagForFile(fullPath);
          if (!result) continue;
          tags = result.tags;
          language = result.language;
          if (stat.size > config.maxFileSize) continue;
        }

        const domain = inferDomain(fullPath);

        assets.push({
          id: generateId(fullPath),
          title: entry.name,
          description,
          tags,
          domain,
          filePath: fullPath,
          dirPath: isDir ? fullPath : normalizedRoot,
          lastModified: formatRelativeTime(stat.mtime),
          size: isDir ? 0 : stat.size,
          status: 'active',
          language,
          isDirectory: isDir,
          rootPath: normalizedRoot,
          executable: isExecutable(fullPath, isDir),
        });

        // 再帰スキャン対象:
        // 1) 事業開発スキル配下（SKILL.md持ちサブを個別に拾う）
        // 2) Google Apps Script フォルダ（配下サブフォルダを個別GASとして拾う）
        const norm = fullPath.replace(/\\/g, '/').toLowerCase();
        const shouldRecurse = isDir && currentDepth < config.maxDepth && (
          (norm.includes('事業開発スキル') && !hasSkillMd(fullPath)) ||
          isUnderGASFolder(fullPath)
        );
        if (shouldRecurse) {
          assets.push(...scanDirectory(fullPath, config, currentDepth + 1));
        }
      } catch {}
    }
  } catch (err) {
    console.error(`スキャンエラー (${normalizedRoot}):`, err);
  }

  return assets;
}

export function scanAll(config: ScanConfig): ScannedAsset[] {
  const all: ScannedAsset[] = [];
  for (const wp of config.watchPaths) {
    all.push(...scanDirectory(wp, config));
  }
  return all;
}

// === ファイル読み取り ===
export function readFileContent(filePath: string, maxSize: number = 1048576): string | null {
  try {
    const p = path.normalize(filePath);
    if (!fs.existsSync(p)) return null;
    const stat = fs.statSync(p);

    // PDFの場合はバイナリパスを返す（フロントでiframe表示する）
    if (p.toLowerCase().endsWith('.pdf')) {
      return '__PDF__';
    }

    if (stat.size > maxSize) return `// ファイルサイズが大きすぎます (${(stat.size / 1024).toFixed(1)} KB)`;

    if (stat.isDirectory()) {
      const priority = ['SKILL.md', 'skill.md', 'README.md', 'readme.md',
        'index.py', 'main.py', 'app.py', 'index.js', 'index.ts', 'main.js', 'main.ts',
        'manifest.json', 'appsscript.json', 'Code.gs'];
      for (const mf of priority) {
        const mp = path.join(p, mf);
        if (fs.existsSync(mp)) return fs.readFileSync(mp, 'utf-8');
      }
      const entries = fs.readdirSync(p);
      const targetExts = ['.py', '.js', '.ts', '.gs', '.md', '.json', '.jsx', '.tsx'];
      for (const entry of entries) {
        if (targetExts.some(ext => entry.endsWith(ext))) {
          return fs.readFileSync(path.join(p, entry), 'utf-8');
        }
      }
      return '// 表示可能なファイルが見つかりません';
    }

    return fs.readFileSync(p, 'utf-8');
  } catch (err) {
    return `// 読み取りエラー: ${err}`;
  }
}

// === ディレクトリツリー ===
export function getDirectoryTree(dirPath: string, depth: number = 3): any[] {
  const result: any[] = [];
  if (depth <= 0) return result;
  try {
    const entries = fs.readdirSync(path.normalize(dirPath), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || ['node_modules', '__pycache__', '.git', 'dist', 'build'].includes(entry.name)) continue;
      const fp = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        result.push({ name: entry.name, type: 'directory', path: fp, children: getDirectoryTree(fp, depth - 1) });
      } else {
        result.push({ name: entry.name, type: 'file', path: fp });
      }
    }
  } catch {}
  return result;
}

// === PDF配信用 ===
export function getPdfPath(filePath: string): string | null {
  const p = path.normalize(filePath);
  if (fs.existsSync(p) && p.toLowerCase().endsWith('.pdf')) return p;
  return null;
}
