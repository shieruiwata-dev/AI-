# DreamStories 日本版 — 岩田さん作業ワークスペース

フロントエンドリード（岩田さん）の12週間の作業を支援するためのリポジトリです。
元資料「DreamStories日本版 岩田さん専用タスク資料 v1.0」に沿って、すぐ使える成果物をここに蓄積していきます。

## 📁 内容

| ファイル | 用途 |
|---|---|
| `design-guideline.md` | 色・フォント・ボタンの基準。**Lovableに毎回貼る**コピペブロック付き |
| `week1-setup-checklist.md` | Week 1 環境セットアップのチェックリスト |
| `progress.md` | 12週間の進捗トラッカー |
| `lovable-prompts/` | 各画面のLovable/Claudeプロンプト（コピペで使える形） |

## 🗂 lovable-prompts/

| ファイル | 使う週 |
|---|---|
| `00-hello-world.md` | Week 1 Day 2（Hello World） |
| `01-week2-project-scaffold.md` | Week 2 Day 1（6画面の骨格を一括生成） |
| `05-supabase-auth.md` | Week 2 Day 4（Supabase認証接続） |

> 画面詳細化（ランディング / オンボード / プレビュー / マイページ）や、Week5のDify連携・Week7のStripe連携のプロンプトは、その週になったら追加していきます。

## 🛠 スタック
Next.js + TypeScript + Tailwind CSS（Lovableが自動生成）／ Supabase（DB・認証）／ Dify（AI生成）／ Stripe（決済）

## 👥 チーム
- 岩田（フロントエンド）← このリポジトリ
- 柴崎（バックエンド：Supabase / Edge Function / Stripe）
- 田中（AIエンジン：Dify）
