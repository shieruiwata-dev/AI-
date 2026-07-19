# Lovable提出用 v3（デザイン＋アニメ＋API接続準備）

これまでの全成果をまとめた11ファイルです。UIの見た目・アニメに加えて、
Week 5〜7 の連携用「API窓口」（`src/lib/api.ts`）が入っています。
ツール類（プレビュー生成・ローカル起動用）は含みません。

## 貼り付け順（この順番なら途中でエラーが出ません）

| # | ファイル | 状態 | 内容 |
|---|---|---|---|
| 1 | `src/styles.css` | 置き換え | 全アニメのkeyframes・デザイントークン |
| 2 | `src/lib/api.ts` | **🆕 新規作成** | API窓口。PDF第8章仕様の型＋モック実装。Week 5はここだけ差し替え |
| 3 | `src/components/BookCover.tsx` | **🆕 新規作成** | 絵本カバー共通部品 |
| 4 | `src/components/Header.tsx` | 置き換え | ヘッダー（スマホ折り返し修正） |
| 5 | `src/components/Footer.tsx` | 置き換え | 4カラムフッター |
| 6 | `src/routes/index.tsx` | 置き換え | ランディング（絵本コラージュ・シマーCTA等） |
| 7 | `src/routes/create.tsx` | 置き換え | チャット（＋回答をSessionStorageへ保存） |
| 8 | `src/routes/generating.tsx` | 置き換え | 生成中（円形プログレス、api.ts駆動） |
| 9 | `src/routes/preview.$id.tsx` | 置き換え | 絵本プレビュー（3Dめくり、getBook経由） |
| 10 | `src/routes/mypage.tsx` | 置き換え | マイページ（絵本カバー化、listBooks経由） |
| 11 | `src/routes/checkout.$id.tsx` | 置き換え | 購入（createCheckoutSession経由） |

## 手順（方法A：コードエディタに貼り付け・おすすめ）

1. Lovableでプロジェクトを開く → 右上 **`</>`（Code / Dev Mode）**
2. 上の表の**順番どおり**に：
   - 「置き換え」→ 同じパスのファイルを開き、全選択して貼り付け
   - 「新規作成」→ ファイルツリーで親フォルダ（`src/lib` は無ければフォルダごと）を
     右クリック → New File → ファイル名を入力 → 貼り付け
3. 全部終わったらプレビューで確認：
   `/` → `/create`（チャットで名前など入力）→ 生成 → プレビューの
   **タイトルに入力した名前が出れば配線もOK**（例：はなこくんの 海の探検）

## 手順（方法B：GitHub連携）
Lovable⇄GitHub連携済みなら、連携ブランチの `src/` にこの11ファイルを
上書きしてpushすれば自動同期されます。

## Week 5〜7 に向けたメモ（柴崎さん・田中さんと共有OK）
- 連携作業は **`src/lib/api.ts` の中だけ**で完結します。
  1. `API_BASE` にEdge FunctionのURLを設定
  2. 各関数の `--- MOCK ---` ブロックを `fetch()` に置き換え
- 関数と担当週：`difyChat`/`generateStory`（Week 5・柴崎さん＋田中さん）、
  `getBook`/`listBooks`（Week 6・Supabase books）、`createCheckoutSession`（Week 7・Stripe）
- リクエスト/レスポンスの形はPDF第8章の合意仕様と同一です。
