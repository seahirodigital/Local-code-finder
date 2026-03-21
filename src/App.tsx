import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Briefcase,
  TrendingUp,
  Code2,
  ClipboardList,
  MoreHorizontal,
  Settings,
  Search,
  Plus,
  Eye,
  FolderSearch,
  Play,
  X,
  RefreshCw,
  Trash2,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Copy,
  ExternalLink,
  AlertCircle,
  Check,
  Loader2,
  Sun,
  Moon,
  BookOpen,
  Wrench,
  Terminal,
  Puzzle,
  Share2,
  Star,
  Pin,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, AssetTag, AssetDomain } from './types';

// もし ./types 側で tags: AssetTag[] となっていなければオーバーライドしておく。今回はインポートしてるので
export interface LocalAsset extends Omit<Asset, 'tag' | 'contentKeywords'> {
  tags: AssetTag[];
}

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// === API ===
async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE}/api/assets`);
  const data = await res.json();
  return data.assets;
}
async function fetchPaths(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/paths`);
  const data = await res.json();
  return data.paths;
}
async function addPath(p: string) {
  const res = await fetch(`${API_BASE}/api/paths`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: p }) });
  return res.json();
}
async function removePath(p: string) {
  const res = await fetch(`${API_BASE}/api/paths`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: p }) });
  return res.json();
}
async function fetchFileContent(filePath: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/assets/content?path=${encodeURIComponent(filePath)}`);
  const data = await res.json();
  return data.content;
}
async function revealInExplorer(filePath: string) {
  await fetch(`${API_BASE}/api/reveal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
}
async function openFileExternally(filePath: string) {
  await fetch(`${API_BASE}/api/open`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
}
async function triggerScan(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/scan`, { method: 'POST' });
  return (await res.json()).count;
}
async function executeScript(filePath: string) {
  const res = await fetch(`${API_BASE}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
  return res.json();
}
async function fetchDirectoryTree(dirPath: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/tree?path=${encodeURIComponent(dirPath)}`);
  return (await res.json()).tree;
}
async function fetchPreferences(): Promise<{ favorites: string[]; pinned: string[] }> {
  const res = await fetch(`${API_BASE}/api/preferences`);
  return res.json();
}
async function savePreferences(favorites: string[], pinned: string[]) {
  await fetch(`${API_BASE}/api/preferences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorites, pinned }) });
}

// === WebSocket Hook ===
function useWebSocket(onMessage: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
      ws.onclose = () => { timer.current = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { if (timer.current) clearTimeout(timer.current); wsRef.current?.close(); };
  }, []);
}

// === Sidebar (ドメイン: ビジネス/投資/エンジニア/総務/その他) ===
const Sidebar = ({ activeNavs, onNavToggle, onSettingsClick, showFavorites, onFavoritesClick, favCount }: { activeNavs: string[]; onNavToggle: (n: string) => void; onSettingsClick: () => void; showFavorites: boolean; onFavoritesClick: () => void; favCount: number }) => (
  <aside className="fixed left-0 top-0 h-screen w-20 border-r border-outline-variant/15 bg-surface-container-low flex flex-col items-center py-8 gap-6 z-50 shadow-md">
    <nav className="flex flex-col flex-1 gap-2 w-full px-2">
      <button onClick={onFavoritesClick} className={`relative w-full flex flex-col items-center transition-all p-2 rounded-xl ${showFavorites ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-500 hover:bg-surface-container-high hover:text-yellow-500'}`} title="お気に入り">
        <Star size={20} fill={showFavorites ? 'currentColor' : 'none'} />
        {favCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold flex items-center justify-center">{favCount}</span>}
      </button>
      <div className="my-2 mx-2 border-t border-outline-variant/15"></div>
      <NavItem icon={<Briefcase size={20} />} label="ビジネス" active={activeNavs.includes('Business')} onClick={() => onNavToggle('Business')} />
      <NavItem icon={<TrendingUp size={20} />} label="投資" active={activeNavs.includes('Investment')} onClick={() => onNavToggle('Investment')} />
      <NavItem icon={<Code2 size={20} />} label="エンジニア" active={activeNavs.includes('Engineer')} onClick={() => onNavToggle('Engineer')} />
      <NavItem icon={<ClipboardList size={20} />} label="総務" active={activeNavs.includes('GeneralAffairs')} onClick={() => onNavToggle('GeneralAffairs')} />
      <div className="my-2 mx-2 border-t border-outline-variant/15"></div>
      <NavItem icon={<MoreHorizontal size={20} />} label="その他" active={activeNavs.includes('Other')} onClick={() => onNavToggle('Other')} />
    </nav>
    <button onClick={onSettingsClick} className="text-slate-500 hover:text-primary transition-colors"><Settings size={20} /></button>
  </aside>
);

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex flex-col items-center transition-all p-2 gap-1 rounded-xl ${active ? 'bg-primary text-on-primary shadow-md' : 'text-slate-500 hover:bg-surface-container-high hover:text-primary'}`}>
    {icon}
    <span className="text-[9px] tracking-widest font-label font-bold">{label}</span>
  </button>
);

// === Header ===
const Header = ({ searchQuery, setSearchQuery, assetCount, isConnected, isScanning, onRefresh, isDark, onToggleTheme }: {
  searchQuery: string; setSearchQuery: (q: string) => void; assetCount: number; isConnected: boolean; isScanning: boolean; onRefresh: () => void; isDark: boolean; onToggleTheme: () => void;
}) => (
  <header className="fixed top-0 left-20 right-0 h-14 bg-background/80 backdrop-blur-md z-40 px-8 flex justify-between items-center border-b border-outline-variant/10">
    <div className="flex items-center gap-6 flex-1">
      <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-1.5 rounded-lg border border-outline-variant/10 w-full max-w-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Search size={16} className="text-slate-500" />
        <input type="text" placeholder="アセットを検索..." className="bg-transparent border-none text-sm text-on-surface focus:outline-none w-full font-body" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex items-center gap-2 px-2 py-0.5 bg-primary-container/20 rounded border border-primary/20 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-error'}`}></div>
          <span className="text-[10px] text-primary font-label uppercase tracking-wider">{isScanning ? 'Scanning' : isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onRefresh} className="text-slate-500 hover:text-primary transition-colors" title="再スキャン"><RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} /></button>
      <button onClick={onToggleTheme} className="text-slate-500 hover:text-primary transition-colors" title="テーマ切替">{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-primary font-headline">Local Finder</span>
        <span className="text-[10px] text-slate-500 font-label uppercase tracking-widest">{assetCount} Assets</span>
      </div>
    </div>
  </header>
);

// === タブ切替（技術カテゴリ: すべて/Python/GAS/Chrome拡張/ドキュメント/スキル/n8n/その他） ===
const tabDefs: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'すべて', icon: null },
  { key: 'Skill', label: 'スキル', icon: <Wrench size={13} /> },
  { key: 'Code', label: 'コード', icon: <Terminal size={13} /> },
  { key: 'GAS', label: 'GAS', icon: <Code2 size={13} /> },
  { key: 'Chrome Extension', label: 'Chrome拡張', icon: <Puzzle size={13} /> },
  { key: 'Markdown', label: 'ドキュメント', icon: <BookOpen size={13} /> },
  { key: 'n8n', label: 'n8n', icon: <Share2 size={13} /> },
  { key: 'Other', label: 'その他', icon: <MoreHorizontal size={13} /> },
];

const CategoryTabs = ({ selected, onSelect, counts, onAddPath }: { selected: string; onSelect: (c: string) => void; counts: Record<string, number>; onAddPath: () => void }) => (
  <div className="bg-surface-container-low border-b border-outline-variant/15 px-8 flex items-center justify-between shrink-0">
    <nav className="flex gap-6 overflow-x-auto">
      {tabDefs.map((t) => (
        <button key={t.key} onClick={() => onSelect(t.key)} className={`py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${selected === t.key ? 'text-primary border-primary' : 'text-on-surface-variant hover:text-on-surface border-transparent'}`}>
          {t.icon}{t.label}
          {counts[t.key] != null && <span className="text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded-full">{counts[t.key]}</span>}
        </button>
      ))}
    </nav>
    <div className="flex gap-3 py-3 shrink-0">
      <button onClick={onAddPath} className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container px-3 py-1.5 rounded-md text-[11px] font-bold text-on-primary shadow-[0_4px_12px_rgba(103,217,201,0.2)] hover:opacity-90 transition-all">
        <FolderPlus size={14} />パス追加
      </button>
    </div>
  </div>
);

// === Tag/Domain 色・アイコン ===
function getTagStyles(tag: AssetTag): string {
  switch (tag) {
    case 'Code': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'GAS': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'Chrome Extension': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'Markdown': return 'bg-slate-500/10 text-slate-600 border-slate-400/20';
    case 'Skill': return 'bg-primary/10 text-primary border-primary/20';
    case 'n8n': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    default: return 'bg-surface-container text-on-surface border-outline-variant/20';
  }
}
function getTagIcon(tag: AssetTag) {
  switch (tag) {
    case 'Code': return <Terminal size={12} />;
    case 'GAS': return <Code2 size={12} />;
    case 'Chrome Extension': return <Puzzle size={12} />;
    case 'Markdown': return <BookOpen size={12} />;
    case 'Skill': return <Wrench size={12} />;
    case 'n8n': return <Share2 size={12} />;
    default: return <FileText size={12} />;
  }
}
function getTagLabel(tag: AssetTag): string {
  switch (tag) {
    case 'Code': return 'コード';
    case 'GAS': return 'GAS';
    case 'Chrome Extension': return 'Chrome拡張';
    case 'Markdown': return 'ドキュメント';
    case 'Skill': return 'スキル';
    case 'n8n': return 'n8n';
    default: return 'その他';
  }
}
function getDomainLabel(d: AssetDomain) {
  switch (d) {
    case 'Business': return 'ビジネス';
    case 'Investment': return '投資';
    case 'Engineer': return 'エンジニア';
    case 'GeneralAffairs': return '総務';
    default: return '';
  }
}
function getDomainColor(d: AssetDomain) {
  switch (d) {
    case 'Business': return 'text-blue-500';
    case 'Investment': return 'text-emerald-500';
    case 'Engineer': return 'text-violet-500';
    case 'GeneralAffairs': return 'text-amber-500';
    default: return 'text-slate-400';
  }
}

// === AssetCard (ダブルクリックでViewer) ===
const AssetCard = ({ asset, onView, onReveal, onExecute, isFavorite, isPinned, onToggleFavorite, onTogglePin }: {
  asset: LocalAsset; onView: (a: LocalAsset) => void; onReveal: (a: LocalAsset) => void; onExecute: (a: LocalAsset) => void; isFavorite: boolean; isPinned: boolean; onToggleFavorite: (id: string) => void; onTogglePin: (id: string) => void; key?: React.Key;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    onDoubleClick={() => onView(asset)}
    className={`group bg-surface-container-low hover:bg-surface-container border rounded-xl p-4 transition-all duration-300 flex flex-col h-full shadow-[0_4px_20px_rgba(6,14,32,0.08)] hover:shadow-[0_8px_30px_rgba(6,14,32,0.15)] cursor-pointer select-none ${isPinned ? 'border-primary/40 ring-1 ring-primary/20' : 'border-outline-variant/10 hover:border-primary/30'}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {isPinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 tracking-wider flex items-center gap-1"><Pin size={10} />PIN</span>}
        {(asset.tags || [(asset as any).tag]).map(t => (
          <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wider flex items-center gap-1 ${getTagStyles(t)}`}>
            {getTagIcon(t)}{getTagLabel(t)}
          </span>
        ))}
        {asset.domain !== 'Engineer' && asset.domain !== 'Other' && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${getDomainColor(asset.domain)}`}>
            {getDomainLabel(asset.domain)}
          </span>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.id); }} className={`transition-colors ${isFavorite ? 'text-yellow-500' : 'opacity-40 group-hover:opacity-100 text-slate-400 hover:text-yellow-500'}`} title="お気に入り"><Star size={16} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        <button onClick={(e) => { e.stopPropagation(); onTogglePin(asset.id); }} className={`transition-colors ${isPinned ? 'text-primary' : 'opacity-40 group-hover:opacity-100 text-slate-400 hover:text-primary'}`} title="ピン留め"><Pin size={16} /></button>
        <div className="w-px h-4 bg-outline-variant/15 mx-0.5"></div>
        <button onClick={(e) => { e.stopPropagation(); onView(asset); }} className="opacity-40 group-hover:opacity-100 hover:text-primary transition-colors" title="コードを表示"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onReveal(asset); }} className="opacity-40 group-hover:opacity-100 hover:text-primary transition-colors" title="フォルダを開く"><FolderSearch size={16} /></button>
        {asset.executable && (
          <button onClick={(e) => { e.stopPropagation(); onExecute(asset); }} className="opacity-40 group-hover:opacity-100 hover:text-primary transition-colors" title="実行"><Play size={16} /></button>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 mb-1">
      {asset.isDirectory ? <Folder size={14} className="text-primary/60 shrink-0" /> : <FileText size={14} className="text-slate-500 shrink-0" />}
      <h3 className="text-on-surface font-bold text-base truncate group-hover:text-primary transition-colors font-headline tracking-tight">{asset.title}</h3>
    </div>
    <p className="text-on-surface-variant text-xs mb-2 line-clamp-2 flex-1">{asset.description}</p>
    <p className="text-[10px] text-slate-600 truncate mb-3 font-mono" title={asset.filePath}>{asset.filePath}</p>
    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-label mt-auto pt-2 border-t border-outline-variant/5">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></span>
      <span>{asset.lastModified}</span>
      {asset.size > 0 && <span className="ml-auto">{(asset.size / 1024).toFixed(1)} KB</span>}
    </div>
  </motion.div>
);

// === TreeNode ===
const TreeNode = ({ node, onSelect }: { node: any; onSelect: (p: string) => void; key?: React.Key; }) => {
  const [expanded, setExpanded] = useState(false);
  if (node.type === 'file') {
    return (<button onClick={() => onSelect(node.path)} className="flex items-center gap-2 py-1 px-2 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50 rounded w-full text-left"><FileText size={12} className="shrink-0" /><span className="truncate">{node.name}</span></button>);
  }
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 py-1 px-2 text-xs text-on-surface hover:text-primary hover:bg-surface-container-high/50 rounded w-full text-left font-medium">
        {expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
        <Folder size={12} className="text-primary/60 shrink-0" /><span className="truncate">{node.name}</span>
      </button>
      {expanded && node.children && <div className="ml-4 border-l border-outline-variant/10">{node.children.map((c: any, i: number) => <TreeNode key={i} node={c} onSelect={onSelect} />)}</div>}
    </div>
  );
};


// === CodeViewer (ドラッグリサイズ) ===
const CodeViewer = ({ asset, onClose }: { asset: Asset | null; onClose: () => void }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [viewPath, setViewPath] = useState('');
  const [width, setWidth] = useState(700);
  const [treeWidth, setTreeWidth] = useState(250);
  const isDraggingMain = useRef(false);
  const isDraggingTree = useRef(false);

  useEffect(() => {
    if (!asset) return;
    setLoading(true);
    setViewPath(asset.filePath);

    fetchFileContent(asset.filePath).then((c) => {
      setContent(c || '// 内容なし');
      setLoading(false);
    }).catch(() => { setContent('// 取得失敗'); setLoading(false); });

    if (asset.isDirectory) fetchDirectoryTree(asset.filePath).then(setTree).catch(() => setTree([]));
    else setTree([]);
  }, [asset]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMain.current) {
        const newWidth = window.innerWidth - e.clientX;
        setWidth(Math.max(300, Math.min(newWidth, window.innerWidth - 100)));
      } else if (isDraggingTree.current) {
        // e.clientX - boundary offset (since it's right-aligned and nested)
        // simpler calculation: 
        // e.clientX is global. Left edge of tree is (window.innerWidth - width) + 6 (pad).
        const leftEdge = window.innerWidth - width;
        const newTreeW = e.clientX - leftEdge;
        setTreeWidth(Math.max(100, Math.min(newTreeW, width - 200)));
      }
    };
    const handleMouseUp = () => { isDraggingMain.current = false; isDraggingTree.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width]);

  const handleTreeSelect = async (fp: string) => {
    if (fp.toLowerCase().endsWith('.pdf')) {
      await openFileExternally(fp);
      return;
    }
    setLoading(true);
    setViewPath(fp);
    try {
      const c = await fetchFileContent(fp);
      setContent(c || '// 内容なし');
    } catch { setContent('// 取得失敗'); }
    setLoading(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!asset) return null;

  const getLang = (p: string) => {
    const ext = p.split('.').pop() || '';
    const m: Record<string, string> = { py: 'python', js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript', gs: 'javascript', md: 'markdown', json: 'json', html: 'html', css: 'css' };
    return m[ext] || asset.language || 'text';
  };

  const highlight = (code: string, lang: string) => {
    if (!code) return <div className="text-slate-500 p-4">表示可能なコンテンツがありません</div>;
    return code.split('\n').map((line, i) => {
      let hl = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (lang === 'python') {
        hl = hl.replace(/\b(import|from|def|class|try|except|return|as|if|elif|else|for|while|with|yield|raise|pass|break|continue|lambda|async|await)\b/g, '<span class="text-secondary">$1</span>').replace(/(["'].*?["'])/g, '<span class="text-tertiary">$1</span>').replace(/\b(print|str|int|float|list|dict|set|tuple|bool|None|True|False|Exception|self)\b/g, '<span class="text-primary">$1</span>').replace(/(#.*)/g, '<span class="text-slate-500">$1</span>');
      } else if (['javascript', 'typescript'].includes(lang)) {
        hl = hl.replace(/\b(const|let|var|function|class|if|else|for|while|return|import|export|from|default|async|await|new|this|typeof|instanceof)\b/g, '<span class="text-secondary">$1</span>').replace(/(["'`].*?["'`])/g, '<span class="text-tertiary">$1</span>').replace(/\b(true|false|null|undefined)\b/g, '<span class="text-primary">$1</span>').replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>');
      } else if (lang === 'json') {
        hl = hl.replace(/(".*?")\s*:/g, '<span class="text-secondary">$1</span>:').replace(/:\s*(".*?")/g, ': <span class="text-tertiary">$1</span>').replace(/\b(true|false|null)\b/g, '<span class="text-primary">$1</span>');
      } else if (lang === 'markdown') {
        hl = hl.replace(/^(#+ .*)/g, '<span class="text-primary font-bold">$1</span>').replace(/(\*\*.*?\*\*)/g, '<span class="text-secondary">$1</span>').replace(/(`.*?`)/g, '<span class="text-tertiary">$1</span>');
      }
      return (<div key={i} className="flex gap-4 hover:bg-surface-container-high/30 px-2 rounded"><div className="text-slate-600 text-right select-none pr-4 border-r border-outline-variant/10 w-10 shrink-0 text-xs py-0.5">{i + 1}</div><div className="flex-1 whitespace-pre overflow-x-visible text-on-surface/90 py-0.5" dangerouslySetInnerHTML={{ __html: hl }} /></div>);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed right-0 top-0 h-screen z-[60] bg-surface-container-low shadow-2xl flex flex-col" style={{ width: width }}>
        {/* メインドラッグハンドル（左端） */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 bg-outline-variant/15 z-10 transition-colors"
          onMouseDown={() => { isDraggingMain.current = true; }}
        />
        <div className="h-14 flex items-center justify-between px-6 border-b border-outline-variant/10 shrink-0 ml-1.5">
          <div className="flex items-center gap-3"><Code2 size={20} className="text-primary" /><div><h2 className="text-sm font-bold text-on-surface font-headline leading-none tracking-tight">Viewer</h2><span className="text-[10px] text-slate-500 uppercase tracking-widest font-label">Source Inspection</span></div></div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-slate-500 hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-container"><X size={20} /></button>
          </div>
        </div>
        <div className="flex items-center gap-4 px-6 py-2 bg-surface-container-lowest border-b border-outline-variant/5 shrink-0 ml-1.5">
          <span className="text-[11px] font-mono text-primary truncate flex-1" title={viewPath}>{viewPath}</span>
          <span className="text-[11px] font-mono text-slate-500">{getLang(viewPath)}</span>
        </div>
        <div className="flex flex-1 overflow-hidden ml-1.5">
          {asset.isDirectory && tree.length > 0 && (
            <div className="border-r border-outline-variant/10 overflow-y-auto bg-surface-container-lowest/50 p-2 shrink-0 flex flex-col" style={{ width: treeWidth }}>
              {tree.map((n, i) => <TreeNode key={i} node={n} onSelect={handleTreeSelect} />)}
            </div>
          )}
          {asset.isDirectory && tree.length > 0 && (
            <div 
              className="w-1 cursor-col-resize hover:bg-primary/50 bg-outline-variant/5 z-10 flex-shrink-0"
              onMouseDown={(e) => { e.preventDefault(); isDraggingTree.current = true; }}
            />
          )}
          <div className="flex-1 overflow-hidden bg-surface-container-lowest/50">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-500"><Loader2 size={24} className="animate-spin" /></div>
            ) : (
              <div className="p-4 font-mono text-sm leading-relaxed overflow-y-auto h-full">{highlight(content, getLang(viewPath))}</div>
            )}
          </div>
        </div>
        <div className="p-4 bg-surface-container border-t border-outline-variant/10 flex justify-end gap-3 shrink-0 ml-1.5">
          <button onClick={handleCopy} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-on-surface transition-colors flex items-center gap-2">{copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}{copied ? 'Copied' : 'コピー'}</button>
          <button onClick={() => revealInExplorer(viewPath)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-on-surface transition-colors flex items-center gap-2"><ExternalLink size={14} />エクスプローラー</button>
        </div>
      </div>
    </AnimatePresence>
  );
};

// === CSVエクスポート ===
function exportAssetsToCSV(assets: LocalAsset[]) {
  const header = ['タイトル', 'カテゴリ(タグ)', 'ドメイン', '説明', 'ファイルパス', '言語', '最終更新', 'サイズ(bytes)', 'ディレクトリ'];
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const rows = assets.map(a => {
    const tags = (a.tags || [(a as any).tag]).join(', ');
    return [a.title, tags, a.domain, a.description, a.filePath, a.language, a.lastModified, String(a.size), a.isDirectory ? 'Yes' : 'No'].map(escape).join(',');
  });
  const bom = '\uFEFF';
  const csv = bom + [header.map(escape).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `local-finder-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// === PathManager ===
const PathManager = ({ isOpen, onClose, paths, onAddPath, onRemovePath, assets }: { isOpen: boolean; onClose: () => void; paths: string[]; onAddPath: (p: string) => void; onRemovePath: (p: string) => void; assets: LocalAsset[] }) => {
  const [newPath, setNewPath] = useState('');
  const [error, setError] = useState('');
  const [exported, setExported] = useState(false);
  const handleAdd = async () => { if (!newPath.trim()) return; setError(''); const r = await addPath(newPath.trim()); if (r.success) { onAddPath(newPath.trim()); setNewPath(''); } else { setError(r.error || '失敗'); } };
  const handleRemove = async (p: string) => { await removePath(p); onRemovePath(p); };
  const handleExport = () => { exportAssetsToCSV(assets); setExported(true); setTimeout(() => setExported(false), 2000); };
  if (!isOpen) return null;
  return (
    <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10"><div><h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">設定</h2><p className="text-xs text-slate-500 mt-1">監視パス管理・データエクスポート</p></div><button onClick={onClose} className="text-slate-500 hover:text-on-surface transition-colors"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><Folder size={14} className="text-primary" />監視パス</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newPath} onChange={(e) => { setNewPath(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="C:\Users\..." className="flex-1 bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-mono" />
              <button onClick={handleAdd} className="bg-gradient-to-br from-primary to-primary-container px-4 py-2 rounded-lg text-on-primary text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"><Plus size={16} />追加</button>
            </div>
            {error && <div className="flex items-center gap-2 text-error text-xs mb-4 bg-error/10 px-3 py-2 rounded-lg"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {paths.map((p) => (<div key={p} className="flex items-center justify-between bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10 group"><div className="flex items-center gap-3 min-w-0"><Folder size={16} className="text-primary shrink-0" /><span className="text-xs font-mono text-on-surface-variant truncate" title={p}>{p}</span></div><button onClick={() => handleRemove(p)} className="text-slate-600 hover:text-error transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2" title="削除"><Trash2 size={14} /></button></div>))}
              {paths.length === 0 && <p className="text-center text-slate-500 text-sm py-4">監視パスが設定されていません</p>}
            </div>
          </div>
          <div className="border-t border-outline-variant/10 pt-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><Download size={14} className="text-primary" />エクスポート</h3>
            <div className="flex items-center justify-between bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10">
              <div><p className="text-sm text-on-surface font-bold">CSV出力</p><p className="text-[11px] text-slate-500 mt-0.5">全アセット一覧（{assets.length}件）をCSVでダウンロード</p></div>
              <button onClick={handleExport} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${exported ? 'bg-green-500/20 text-green-500' : 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90'}`}>
                {exported ? <><Check size={14} />完了</> : <><Download size={14} />ダウンロード</>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div></AnimatePresence>
  );
};

// === ExecutionResult ===
const ExecutionResult = ({ isOpen, onClose, result }: { isOpen: boolean; onClose: () => void; result: { success: boolean; stdout: string; stderr: string } | null }) => {
  if (!isOpen || !result) return null;
  return (
    <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10"><div className="flex items-center gap-3"><Terminal size={20} className={result.success ? 'text-primary' : 'text-error'} /><h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">{result.success ? '実行完了' : '実行エラー'}</h2></div><button onClick={onClose} className="text-slate-500 hover:text-on-surface transition-colors"><X size={20} /></button></div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {result.stdout && <div className="mb-4"><p className="text-xs text-primary font-bold mb-2">stdout</p><pre className="bg-surface-container-lowest p-4 rounded-lg text-xs font-mono text-on-surface whitespace-pre-wrap border border-outline-variant/10">{result.stdout}</pre></div>}
          {result.stderr && <div><p className="text-xs text-error font-bold mb-2">stderr</p><pre className="bg-error/5 p-4 rounded-lg text-xs font-mono text-error whitespace-pre-wrap border border-error/20">{result.stderr}</pre></div>}
          {!result.stdout && !result.stderr && <p className="text-slate-500 text-sm text-center py-4">出力なし</p>}
        </div>
      </motion.div>
    </motion.div></AnimatePresence>
  );
};

// === ScriptSelectModal ===
const ScriptSelectModal = ({ isOpen, onClose, directoryPath, onExecute }: { isOpen: boolean; onClose: () => void; directoryPath: string | null; onExecute: (p: string) => void }) => {
  const [pyFiles, setPyFiles] = useState<{name: string, path: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && directoryPath) {
      setLoading(true);
      fetchDirectoryTree(directoryPath).then(tree => {
        const findPyFiles = (nodes: any[], result: any[] = []) => {
          for (const node of nodes) {
            if (node.type === 'file' && node.name.endsWith('.py')) {
              result.push(node);
            } else if (node.type === 'directory' && node.children) {
              findPyFiles(node.children, result);
            }
          }
          return result;
        };
        setPyFiles(findPyFiles(tree));
        setLoading(false);
      }).catch(() => { setPyFiles([]); setLoading(false); });
    }
  }, [isOpen, directoryPath]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/10 shrink-0">
            <div className="flex items-center gap-3"><Play size={20} className="text-primary" /><h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">実行するファイルを選択</h2></div>
            <button onClick={onClose} className="text-slate-500 hover:text-on-surface transition-colors"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 size={24} className="animate-spin" /></div> : pyFiles.length > 0 ? (
              <div className="space-y-2">
                {pyFiles.map(file => (
                  <div key={file.path} className="flex items-center justify-between bg-surface-container-lowest px-4 py-3 rounded-lg border border-outline-variant/10 group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0"><FileText size={16} className="text-slate-500 shrink-0" /><div className="flex flex-col min-w-0"><span className="text-sm font-bold text-on-surface truncate">{file.name}</span><span className="text-[10px] font-mono text-slate-500 truncate" title={file.path}>{file.path}</span></div></div>
                    <button onClick={() => { onExecute(file.path); onClose(); }} className="bg-gradient-to-br from-primary to-primary-container px-3 py-1.5 rounded-md text-[11px] font-bold text-on-primary hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(103,217,201,0.2)] flex items-center gap-1 shrink-0 ml-4"><Play size={12} /> 実行</button>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8 text-slate-500"><p className="text-sm">実行可能なPythonファイルが見つかりません</p></div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// === Main App ===
export default function App() {
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [sidebarFilters, setSidebarFilters] = useState<string[]>([]); // 複数選択化
  const [tabFilter, setTabFilter] = useState('all');       // タグフィルタ
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'date-desc'|'date-asc'|'alpha-asc'|'alpha-desc'>('date-desc');
  const [selectedAsset, setSelectedAsset] = useState<LocalAsset | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasTriedConnect, setHasTriedConnect] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showPathManager, setShowPathManager] = useState(false);
  const [execResult, setExecResult] = useState<{ success: boolean; stdout: string; stderr: string } | null>(null);
  const [showExecResult, setShowExecResult] = useState(false);
  const [showScriptSelect, setShowScriptSelect] = useState(false);
  const [scriptSelectDirPath, setScriptSelectDirPath] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false); // Light mode default
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, p, prefs] = await Promise.all([fetchAssets(), fetchPaths(), fetchPreferences()]);
        setAssets(a); setPaths(p); setIsConnected(true);
        setFavorites(prefs.favorites || []); setPinned(prefs.pinned || []);
      } catch { setIsConnected(false); }
      setHasTriedConnect(true);
    })();
  }, []);

  useWebSocket(useCallback((data: any) => {
    if (data.type === 'assets_updated') setAssets(data.assets);
    else if (data.type === 'paths_updated') setPaths(data.paths);
    setIsConnected(true);
  }, []));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      savePreferences(next, pinned);
      return next;
    });
  };
  const togglePin = (id: string) => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      savePreferences(favorites, next);
      return next;
    });
  };
  const handleFavoritesClick = () => {
    setShowFavorites(prev => !prev);
    setSidebarFilters([]);
    setTabFilter('all');
  };

  const handleRefresh = async () => { setIsScanning(true); try { await triggerScan(); setAssets(await fetchAssets()); } catch {} setIsScanning(false); };
  const handleReveal = async (a: LocalAsset) => { await revealInExplorer(a.isDirectory ? a.filePath : a.dirPath); };
  const handleExecute = async (a: LocalAsset) => {
    if (a.filePath.endsWith('.py')) {
      const r = await executeScript(a.filePath);
      setExecResult(r); setShowExecResult(true);
    } else if (a.isDirectory && a.executable) {
      setScriptSelectDirPath(a.filePath);
      setShowScriptSelect(true);
    } else { 
      await revealInExplorer(a.filePath); 
    }
  };

  const executeSelectedScript = async (scriptPath: string) => {
    const r = await executeScript(scriptPath);
    setExecResult(r); setShowExecResult(true);
  };
  const handleView = async (a: LocalAsset) => {
    if (a.filePath.toLowerCase().endsWith('.pdf')) {
      await openFileExternally(a.filePath);
      return;
    }
    setSelectedAsset(a);
  };
  const handleNavToggle = (nav: string) => {
    setTabFilter('all');
    setShowFavorites(false);
    setSidebarFilters(prev => prev.includes(nav) ? prev.filter(n => n !== nav) : [...prev, nav]);
  };

  const handleTabClick = (tabId: string) => {
    setSidebarFilters([]);
    setShowFavorites(false);
    setTabFilter(tabId);
  };

// フィルタ
  let filtered = assets.filter((a) => {
    if (showFavorites && !favorites.includes(a.id)) return false;
    const rawTags = a.tags || [(a as any).tag];
    if (sidebarFilters.length > 0 && !sidebarFilters.includes(a.domain)) return false;
    if (tabFilter !== 'all' && !rawTags.includes(tabFilter as any)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.filePath.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ソート（ピン留めは常に上位）
  filtered = filtered.sort((a, b) => {
    const aPinned = pinned.includes(a.id) ? 1 : 0;
    const bPinned = pinned.includes(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    if (sortOrder === 'alpha-asc') return a.title.localeCompare(b.title);
    if (sortOrder === 'alpha-desc') return b.title.localeCompare(a.title);
    if (sortOrder === 'date-desc') return a.lastModified === b.lastModified ? 0 : -1;
    if (sortOrder === 'date-asc') return a.lastModified === b.lastModified ? 0 : 1;
    return 0;
  });

  // タブカウント（サイドバーフィルタ適用後）
  const inSidebar = assets.filter(a => sidebarFilters.length === 0 || sidebarFilters.includes(a.domain));
  const counts: Record<string, number> = { all: inSidebar.length };
  for (const a of inSidebar) {
    const rawTags = a.tags || [(a as any).tag];
    for (const t of rawTags) {
      if (t) counts[t] = (counts[t] || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex">
      <Sidebar activeNavs={sidebarFilters} onNavToggle={handleNavToggle} onSettingsClick={() => setShowPathManager(true)} showFavorites={showFavorites} onFavoritesClick={handleFavoritesClick} favCount={favorites.length} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} assetCount={assets.length} isConnected={isConnected} isScanning={isScanning} onRefresh={handleRefresh} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
      <main className="ml-20 mt-14 flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative">
        <CategoryTabs selected={tabFilter} onSelect={handleTabClick} counts={counts} onAddPath={() => setShowPathManager(true)} />
        <div className="flex-1 overflow-y-auto p-10 relative z-10">
          {!isConnected && !hasTriedConnect && (
            <div className="mb-6 flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-3 rounded-lg">
              <Loader2 size={16} className="text-primary animate-spin shrink-0" />
              <p className="text-sm text-primary font-bold">バックエンドに接続中...</p>
            </div>
          )}
          {!isConnected && hasTriedConnect && (
            <div className="mb-6 flex items-center gap-3 bg-error/10 border border-error/20 px-4 py-3 rounded-lg">
              <AlertCircle size={16} className="text-error shrink-0" />
              <div><p className="text-sm text-error font-bold">バックエンドに接続できません</p><p className="text-xs text-error/70 mt-0.5"><code className="bg-error/10 px-1 rounded">start.bat</code> をダブルクリックして起動してください</p></div>
            </div>
          )}

          {/* フィルター＆ソートコントロール */}
          <div className="flex items-center justify-between mb-6 group">
            <h2 className="text-sm font-bold opacity-60 flex items-center gap-2"><Briefcase size={16} />{filtered.length} Items</h2>
            <div className="flex gap-2">
              <select 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value as any)}
                className="bg-surface-container border border-outline-variant/20 px-3 py-1.5 rounded-md text-xs font-bold text-on-surface focus:outline-none"
              >
                <option value="date-desc">日時：降順</option>
                <option value="date-asc">日時：昇順</option>
                <option value="alpha-asc">名前：A-Z</option>
                <option value="alpha-desc">名前：Z-A</option>
              </select>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((a) => <AssetCard key={a.id} asset={a} onView={handleView} onReveal={handleReveal} onExecute={handleExecute} isFavorite={favorites.includes(a.id)} isPinned={pinned.includes(a.id)} onToggleFavorite={toggleFavorite} onTogglePin={togglePin} />)}
            </div>
          </AnimatePresence>
          {filtered.length === 0 && isConnected && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold">アセットが見つかりません</p>
              {sidebarFilters.length > 0 && (
                <p className="text-xs text-primary/80 mt-2 bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Briefcase size={12} /> 左メニューで「{sidebarFilters.map(f => getDomainLabel(f as any)).join(', ')}」に絞り込まれています。
                </p>
              )}
              {assets.length === 0 && <button onClick={() => setShowPathManager(true)} className="mt-4 text-primary text-sm hover:underline flex items-center gap-2"><FolderPlus size={14} />監視パスを追加</button>}
            </div>
          )}
        </div>
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full"></div>
        </div>
      </main>
      <CodeViewer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      <AnimatePresence>{selectedAsset && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAsset(null)} className="fixed inset-0 bg-black/5 z-50" />}</AnimatePresence>
      <PathManager isOpen={showPathManager} onClose={() => setShowPathManager(false)} paths={paths} onAddPath={(p) => { setPaths([...paths, p]); handleRefresh(); }} onRemovePath={(p) => { setPaths(paths.filter(pp => pp !== p)); handleRefresh(); }} assets={assets} />
      <ScriptSelectModal isOpen={showScriptSelect} onClose={() => setShowScriptSelect(false)} directoryPath={scriptSelectDirPath} onExecute={executeSelectedScript} />
      <ExecutionResult isOpen={showExecResult} onClose={() => setShowExecResult(false)} result={execResult} />
    </div>
  );
}
