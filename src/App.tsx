import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  Code2, 
  Puzzle, 
  BookOpen, 
  Share2, 
  Settings, 
  Search, 
  UserCircle, 
  Filter, 
  Plus,
  Eye,
  FolderSearch,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockAssets } from './data';
import { Asset, AssetCategory } from './types';

// Components
const Sidebar = () => (
  <aside className="fixed left-0 top-0 h-screen w-20 border-r border-outline-variant/15 bg-surface-container-low flex flex-col items-center py-8 gap-6 z-50">
    <nav className="flex flex-col flex-1 gap-2 w-full">
      <NavItem icon={<LayoutDashboard size={20} />} label="ダッシュ" active />
      <NavItem icon={<Terminal size={20} />} label="ターミナル" />
      <NavItem icon={<Code2 size={20} />} label="コード" />
      <NavItem icon={<Puzzle size={20} />} label="クロム拡張" />
      <NavItem icon={<BookOpen size={20} />} label="ドキュメント" />
      <NavItem icon={<Share2 size={20} />} label="N8N" />
    </nav>
    <button className="text-slate-500 hover:text-primary transition-colors">
      <Settings size={20} />
    </button>
  </aside>
);

const NavItem = ({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex flex-col items-center transition-all py-2 gap-1 ${active ? 'text-primary bg-surface-container border-l-2 border-primary' : 'text-slate-500 hover:bg-surface-container hover:text-primary border-l-2 border-transparent'}`}>
    {icon}
    <span className="text-[9px] uppercase tracking-widest font-label font-bold">{label}</span>
  </button>
);

const Header = ({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (q: string) => void }) => (
  <header className="fixed top-0 left-20 right-0 h-14 bg-background/80 backdrop-blur-md z-40 px-8 flex justify-between items-center border-b border-outline-variant/10">
    <div className="flex items-center gap-6 flex-1">
      <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-1.5 rounded-lg border border-outline-variant/10 w-full max-w-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Search size={16} className="text-slate-500" />
        <input 
          type="text" 
          placeholder="アセットを検索..." 
          className="bg-transparent border-none text-sm text-on-surface focus:outline-none w-full font-body"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 px-2 py-0.5 bg-primary-container/20 rounded border border-primary/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] text-primary font-label uppercase tracking-wider">Scanning</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-primary font-headline">PAN v2.0</span>
        <span className="text-[10px] text-slate-500 font-label uppercase tracking-widest">Scanning...</span>
      </div>
      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
        <UserCircle size={20} className="text-primary" />
      </div>
    </div>
  </header>
);

const CategoryTabs = ({ selected, onSelect }: { selected: string, onSelect: (c: string) => void }) => {
  const categories = ['すべて', 'Python', 'GAS', 'Chrome Extension', 'Markdown', 'n8n'];
  
  return (
    <div className="bg-surface-container-low border-b border-outline-variant/15 px-8 flex items-center justify-between shrink-0">
      <nav className="flex gap-8">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => onSelect(cat)}
            className={`py-4 text-xs font-bold transition-all border-b-2 ${selected === cat ? 'text-primary border-primary' : 'text-on-surface-variant hover:text-on-surface border-transparent'}`}
          >
            {cat}
          </button>
        ))}
      </nav>
      <div className="flex gap-3 py-3">
        <button className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-md text-[11px] font-bold border border-outline-variant/20 hover:bg-surface-container-highest transition-colors">
          <Filter size={14} />
          フィルタ
        </button>
        <button className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container px-3 py-1.5 rounded-md text-[11px] font-bold text-on-primary shadow-[0_4px_12px_rgba(103,217,201,0.2)] hover:opacity-90 transition-all">
          <Plus size={14} />
          新規アセット
        </button>
      </div>
    </div>
  );
};

const AssetCard = ({ asset, onView }: { asset: Asset, onView: (a: Asset) => void }) => {
  const getCategoryStyles = (category: AssetCategory) => {
    switch (category) {
      case 'Python': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'GAS': return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      case 'Chrome Extension': return 'bg-primary/10 text-primary border-primary/20';
      case 'Markdown': return 'bg-on-surface-variant/10 text-on-surface-variant border-on-surface-variant/20';
      case 'n8n': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-container text-on-surface border-outline-variant/20';
    }
  };

  return (
    <div className="group bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 hover:border-primary/30 rounded-xl p-4 transition-all duration-300 flex flex-col h-full shadow-[0_4px_20px_rgba(6,14,32,0.2)] hover:shadow-[0_8px_30px_rgba(6,14,32,0.4)]">
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryStyles(asset.category)}`}>
          {asset.category}
        </span>
        <div className="flex gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onView(asset)} className="hover:text-primary transition-colors" title="コードを表示"><Eye size={16} /></button>
          <button className="hover:text-primary transition-colors" title="フォルダを開く"><FolderSearch size={16} /></button>
          <button className="hover:text-primary transition-colors" title="実行"><Zap size={16} /></button>
        </div>
      </div>
      <h3 className="text-on-surface font-bold text-base mb-1 truncate group-hover:text-primary transition-colors font-headline tracking-tight">{asset.title}</h3>
      <p className="text-on-surface-variant text-xs mb-4 line-clamp-2 flex-1">{asset.description}</p>
      
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-label mt-auto pt-2 border-t border-outline-variant/5">
        {asset.status === 'error' ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></div>
            <span className="text-error">エラー検知</span>
          </>
        ) : asset.status === 'scanning' ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0"></div>
            <span className="text-primary">スキャン中...</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></span>
            <span>{asset.lastSync}</span>
          </>
        )}
      </div>
    </div>
  );
};

const CodeViewer = ({ asset, onClose }: { asset: Asset | null, onClose: () => void }) => {
  if (!asset) return null;

  // Simple syntax highlighting simulation
  const highlightCode = (code: string, lang: string) => {
    if (!code) return null;
    const lines = code.split('\n');
    return lines.map((line, i) => {
      // Very basic highlighting for demonstration
      let highlightedLine = line;
      if (lang === 'python') {
        highlightedLine = highlightedLine
          .replace(/\b(import|from|def|try|except|return|as)\b/g, '<span class="text-secondary">$1</span>')
          .replace(/(["'].*?["'])/g, '<span class="text-tertiary">$1</span>')
          .replace(/\b(print|str|Exception)\b/g, '<span class="text-primary">$1</span>')
          .replace(/(#.*)/g, '<span class="text-slate-500">$1</span>');
      } else if (lang === 'javascript' || lang === 'json') {
        highlightedLine = highlightedLine
          .replace(/\b(const|function|if|return)\b/g, '<span class="text-secondary">$1</span>')
          .replace(/(["'].*?["'])/g, '<span class="text-tertiary">$1</span>')
          .replace(/\b(true|false|null)\b/g, '<span class="text-primary">$1</span>');
      } else if (lang === 'markdown') {
        highlightedLine = highlightedLine
          .replace(/^(#+ .*)/g, '<span class="text-primary font-bold">$1</span>')
          .replace(/(\*\*.*?\*\*)/g, '<span class="text-secondary">$1</span>')
          .replace(/(\`.*?\`)/g, '<span class="text-tertiary">$1</span>');
      }

      return (
        <div key={i} className="flex gap-4 hover:bg-surface-container-high/30 px-2 rounded">
          <div className="text-slate-600 text-right select-none pr-4 border-r border-outline-variant/10 w-10 shrink-0 text-xs py-0.5">
            {i + 1}
          </div>
          <div className="flex-1 whitespace-pre overflow-x-visible text-on-surface/90 py-0.5" dangerouslySetInnerHTML={{ __html: highlightedLine }} />
        </div>
      );
    });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-screen w-full max-w-[600px] z-[60] bg-surface-container-low/95 backdrop-blur-xl border-l border-outline-variant/15 shadow-2xl flex flex-col"
      >
        <div className="h-14 flex items-center justify-between px-6 border-b border-outline-variant/10 shrink-0">
          <div className="flex items-center gap-3">
            <Code2 size={20} className="text-primary" />
            <div>
              <h2 className="text-sm font-bold text-on-surface font-headline leading-none tracking-tight">Code Viewer</h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-label">Source Inspection</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-container">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 px-6 py-2 bg-surface-container-lowest border-b border-outline-variant/5 shrink-0">
          <span className="text-[11px] font-mono text-primary">{asset.title}</span>
          <span className="text-[11px] font-mono text-slate-500">utf-8</span>
          <span className="text-[11px] font-mono text-slate-500">{asset.language || 'text'}</span>
        </div>
        
        <div className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-y-auto bg-surface-container-lowest/50">
          {highlightCode(asset.codeSnippet || '', asset.language || '')}
        </div>
        
        <div className="p-4 bg-surface-container border-t border-outline-variant/10 flex justify-end gap-3 shrink-0">
          <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-on-surface transition-colors">コピー</button>
          <button className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded text-xs font-bold hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(103,217,201,0.2)]">
            エディタで開く
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = mockAssets.filter(asset => {
    const matchesCategory = selectedCategory === 'すべて' || asset.category === selectedCategory;
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex">
      <Sidebar />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main className="ml-20 mt-14 flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative">
        <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />
        
        <div className="flex-1 overflow-y-auto p-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} onView={setSelectedAsset} />
            ))}
          </div>
          {filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Search size={48} className="mb-4 opacity-20" />
              <p>アセットが見つかりません</p>
            </div>
          )}
        </div>

        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full"></div>
        </div>
      </main>

      <CodeViewer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      
      {/* Overlay for CodeViewer */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
