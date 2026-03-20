// タブ切替用カテゴリ（技術分類）
export type AssetTag =
  | 'Code'
  | 'GAS'
  | 'Chrome Extension'
  | 'Markdown'
  | 'Skill'
  | 'n8n'
  | 'Other';

// サイドバー用ドメイン（業務分類）
export type AssetDomain =
  | 'Business'
  | 'Investment'
  | 'Engineer'
  | 'GeneralAffairs'
  | 'Other';

export interface Asset {
  id: string;
  title: string;
  description: string;
  tag: AssetTag;       // タブ切替用（技術分類）
  domain: AssetDomain; // サイドバー用（業務分類）
  filePath: string;
  dirPath: string;
  lastModified: string;
  size: number;
  status: 'scanning' | 'error' | 'active';
  language: string;
  isDirectory: boolean;
  rootPath: string;
  executable: boolean;
  contentKeywords: string;
}
