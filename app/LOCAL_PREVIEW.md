# ローカルプレビュー手順（Claudeで調整するための環境）

Lovableのクレジットを使わず、このプロジェクトをローカルで動かして画面を見ながら調整するための手順です。

## セットアップ（初回のみ）
```bash
cd app
bun install
```

## 開発サーバー起動
```bash
cd app
node --import ./local-ipv4.mjs node_modules/vite/bin/vite.js dev
# → http://localhost:8080/ で表示
```

> **なぜ `--import ./local-ipv4.mjs` が必要？**
> このクラウド実行環境はIPv4のみで、devサーバーが既定でIPv6(`::`)にバインドしようとして
> 失敗します（`EAFNOSUPPORT`）。`local-ipv4.mjs` はNodeの`listen`をフックして`::`を
> `0.0.0.0`に読み替えるだけの薄いシムです。**ローカル起動専用**で、Lovable本体・本番ビルド
> には一切影響しません（プロジェクトのソースは無改変）。
> 手元のPC（IPv6が使える環境）では、普通に `bun run dev` でOKです。

## 画面のスクリーンショット（Claudeが確認用に使用）
```bash
cd app
# 使い方: node screenshot.mjs <URL> <出力パス> <横幅px>
node screenshot.mjs http://127.0.0.1:8080/ /tmp/landing.png 390    # スマホ幅
node screenshot.mjs http://127.0.0.1:8080/ /tmp/landing-pc.png 1440 # PC幅
```

## 調整のながれ
1. `src/routes/index.tsx` などを編集
2. Vite が自動リロード → スクリーンショットで確認
3. 良ければ、その差分を Lovable 側にも反映（GitHub連携 or 手動コピー）

## 主要ファイル
| パス | 内容 |
|---|---|
| `src/routes/index.tsx` | ランディングページ |
| `src/routes/create.tsx` | オンボードチャット |
| `src/routes/generating.tsx` | 生成中画面 |
| `src/routes/preview.$id.tsx` | プレビュー |
| `src/routes/checkout.$id.tsx` | 購入 |
| `src/routes/mypage.tsx` | マイページ |
| `src/styles.css` | デザイントークン（色・フォント・ボタン） |
| `src/components/Header.tsx` / `Footer.tsx` | 共通ヘッダー・フッター |
