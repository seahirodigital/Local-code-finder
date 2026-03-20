import { Asset } from './types';

export const mockAssets: Asset[] = [
  {
    id: '1',
    title: 'Data_Processor_v4.py',
    description: 'JSONデータのバッチ処理とSQLインポート。',
    category: 'Python',
    lastSync: '2時間前に同期',
    language: 'python',
    codeSnippet: `import os
import json
from datetime import datetime

def process_payload(data):
    # Process incoming JSON structure
    timestamp = datetime.now().isoformat()
    try:
        result = {
            "status": "success",
            "id": data["uuid"],
            "processed_at": timestamp
        }
        return result
    except Exception as e:
        return {"error": str(e)}`
  },
  {
    id: '2',
    title: 'Auto_Mailer_Trigger',
    description: 'スプレッドシート更新時の自動メール通知システム。',
    category: 'GAS',
    lastSync: '1日前',
    language: 'javascript',
    codeSnippet: `function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== "Targets") return;
  
  const range = e.range;
  if (range.getColumn() === 5 && e.value === "Send") {
    const row = range.getRow();
    const email = sheet.getRange(row, 2).getValue();
    const name = sheet.getRange(row, 1).getValue();
    
    MailApp.sendEmail({
      to: email,
      subject: "Automated Notification",
      body: \`Hello \${name},\\n\\nYour request has been processed.\`
    });
    
    sheet.getRange(row, 6).setValue("Sent");
  }
}`
  },
  {
    id: '3',
    title: 'DOM_Inspector_Tool',
    description: '開発者向けDOM解析拡張機能。',
    category: 'Chrome Extension',
    lastSync: '現在稼働中',
    language: 'json',
    codeSnippet: `{
  "manifest_version": 3,
  "name": "DOM Inspector Tool",
  "version": "1.0.0",
  "description": "Advanced DOM analysis for developers.",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}`
  },
  {
    id: '4',
    title: 'System_Specs_v2.md',
    description: 'インフラ構成図とAPI仕様書のリファレンス。',
    category: 'Markdown',
    lastSync: '3日前',
    language: 'markdown',
    codeSnippet: `# System Specifications v2.0

## Overview
This document outlines the core architecture of the PAN system.

## Components
1. **Frontend**: React, Tailwind CSS, Vite
2. **Backend**: FastAPI, Python Watchdog
3. **Database**: PostgreSQL (managed via Supabase)

## API Endpoints
- \`GET /api/assets\`: Retrieve all scanned assets.
- \`POST /api/scan\`: Trigger a manual directory scan.
- \`GET /api/assets/{id}/content\`: Get file content for viewer.`
  },
  {
    id: '5',
    title: 'Webhook_Sync_Flow',
    description: '外部APIからのWebHook受信とDB同期ワークフロー。',
    category: 'n8n',
    lastSync: '10分前',
    status: 'error',
    language: 'json',
    codeSnippet: `{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "sync-data",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": "public",
        "table": "sync_logs",
        "columns": "id, payload, status"
      },
      "name": "Postgres",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [500, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Postgres",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`
  },
  {
    id: '6',
    title: 'Cloud_Backup_S3.py',
    description: 'AWS S3への増分バックアップスクリプト。',
    category: 'Python',
    lastSync: '5時間前',
    language: 'python',
    codeSnippet: `import boto3
import os
from pathlib import Path

s3 = boto3.client('s3')
BUCKET_NAME = 'pan-system-backups'
SOURCE_DIR = '/var/data/pan'

def backup_to_s3():
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, SOURCE_DIR)
            s3_key = f"backups/{relative_path}"
            
            print(f"Uploading {local_path} to s3://{BUCKET_NAME}/{s3_key}")
            s3.upload_file(local_path, BUCKET_NAME, s3_key)

if __name__ == "__main__":
    backup_to_s3()`
  }
];
