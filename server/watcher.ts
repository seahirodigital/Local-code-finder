import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';

export interface WatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  filePath: string;
  rootPath: string;
}

type EventCallback = (event: WatchEvent) => void;

export class FileWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private callbacks: EventCallback[] = [];
  private ignoredPatterns: string[];

  constructor(ignoredPatterns: string[] = []) {
    this.ignoredPatterns = ignoredPatterns;
  }

  onEvent(callback: EventCallback) {
    this.callbacks.push(callback);
  }

  private emit(event: WatchEvent) {
    for (const cb of this.callbacks) {
      cb(event);
    }
  }

  // 単一パスの監視を開始
  watch(watchPath: string) {
    const normalizedPath = path.normalize(watchPath);

    if (this.watchers.has(normalizedPath)) {
      return; // 既に監視中
    }

    const ignored: Array<string | RegExp> = this.ignoredPatterns.map(p => `**/${p}/**`);
    ignored.push(/(^|[\/\\])\../); // dotファイルを無視

    const watcher = chokidar.watch(normalizedPath, {
      ignored,
      persistent: true,
      ignoreInitial: true,
      depth: 2, // 第2階層まで監視（パフォーマンス考慮）
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    watcher
      .on('add', (filePath: string) => {
        this.emit({ type: 'add', filePath, rootPath: normalizedPath });
      })
      .on('change', (filePath: string) => {
        this.emit({ type: 'change', filePath, rootPath: normalizedPath });
      })
      .on('unlink', (filePath: string) => {
        this.emit({ type: 'unlink', filePath, rootPath: normalizedPath });
      })
      .on('addDir', (dirPath: string) => {
        // ルートディレクトリ自体は通知しない
        if (path.normalize(dirPath) !== normalizedPath) {
          this.emit({ type: 'addDir', filePath: dirPath, rootPath: normalizedPath });
        }
      })
      .on('unlinkDir', (dirPath: string) => {
        this.emit({ type: 'unlinkDir', filePath: dirPath, rootPath: normalizedPath });
      })
      .on('error', (error: Error) => {
        console.error(`監視エラー (${normalizedPath}):`, error.message);
      });

    this.watchers.set(normalizedPath, watcher);
    console.log(`監視開始: ${normalizedPath}`);
  }

  // 単一パスの監視を停止
  async unwatch(watchPath: string) {
    const normalizedPath = path.normalize(watchPath);
    const watcher = this.watchers.get(normalizedPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(normalizedPath);
      console.log(`監視停止: ${normalizedPath}`);
    }
  }

  // 全監視を停止
  async close() {
    for (const [watchPath, watcher] of this.watchers) {
      await watcher.close();
      console.log(`監視停止: ${watchPath}`);
    }
    this.watchers.clear();
  }

  // 監視中のパス一覧
  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }
}
