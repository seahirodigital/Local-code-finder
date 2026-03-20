export type AssetCategory = 'Python' | 'GAS' | 'Chrome Extension' | 'Markdown' | 'n8n';

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: AssetCategory;
  lastSync: string;
  status?: 'scanning' | 'error' | 'active';
  codeSnippet?: string;
  language?: string;
}
