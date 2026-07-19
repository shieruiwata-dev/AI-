# Lovable提出用：デザイン・レイアウト・アニメーション一式（v2）

これまでに作ったUIの実体だけをまとめたフォルダです。プレビュー生成やローカル起動のツール類は含みません。

## 中身（9ファイル）

| ファイル | 内容 |
|---|---|
| `src/styles.css` | **最初に反映**。全アニメの `@keyframes`（ヒーロー縦スクロール・浮遊・背景ブロブ・マーキー・スクロール表示・シマー・ウィグル・めくりの落ち影・チャットのドット等）とデザイントークン |
| `src/components/BookCover.tsx` | **新規**。絵本カバー共通部品（背表紙＋タイトルバー装飾）。LPとマイページが使用 |
| `src/components/Header.tsx` | ヘッダー（スマホ折り返し修正済み） |
| `src/components/Footer.tsx` | 4カラムフッター |
| `src/routes/index.tsx` | ランディング（中央見出し＋両脇の絵本が↓↑スクロール、キッカー、点線ステップ、シマーCTA、マーキーギャラリー、FAQ） |
| `src/routes/create.tsx` | オンボードチャット（タイピング演出・進捗・テーマ選択） |
| `src/routes/generating.tsx` | 生成中（円形グラデプログレス・4段階ステータス・星の演出） |
| `src/routes/preview.$id.tsx` | 絵本プレビュー（3Dページめくり＋紙のカール質感・固定サイズ） |
| `src/routes/mypage.tsx` | マイページ（絵本カバー化＋ホバーで持ち上がる） |

## Lovableへの反映手順

### 方法A：コードエディタに貼り付け（手軽・おすすめ）
1. Lovableでプロジェクトを開く → 右上 **`</>`（Code / Dev Mode）**
2. **まず `src/styles.css`** を開き、全選択→このフォルダの同名ファイルの中身を貼り付け
3. 次に `src/components/BookCover.tsx` を**新規作成**（左のファイルツリーで components フォルダ右クリック → New File）して貼り付け
4. 残り7ファイルを、同じパスのファイルに順に貼り付けて置き換え
5. プレビューで全画面（/ /create /generating /preview/demo /mypage）を確認

### 方法B：GitHub連携（資料 第8章）
Lovable⇄GitHub連携済みなら、連携ブランチにこの `src/` を上書きしてpushすると自動同期されます。

## 注意
- 貼り付け順は「styles.css → BookCover.tsx → 残り」。先にCSSと新規部品を入れると、他のファイルがエラーなく動きます。
- `checkout.$id.tsx`（購入画面）は今回未変更のため含んでいません。Lovable側はそのままでOK。
- Reactの性質上、各ファイルは「見た目＋そのUIを動かす最小限のロジック」が一体です。外したのはプレビュー用の外部ツールだけです。
