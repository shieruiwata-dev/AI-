-- ============================================================================
-- DreamStories日本版 DBスキーマ
-- 出典：柴崎さんのDB仕様書（DreamStories_DB仕様書.xlsx / Week 3 Day 5版）を
--       そのままSQL化したもの＋RLSポリシー案（※RLSは仕様書に未記載のため要確認）
-- 使い方：Supabase Dashboard → SQL Editor に全文貼り付けて Run
-- ============================================================================

-- ============================== books ======================================
-- 生成された絵本。1ユーザー : N絵本
create table if not exists public.books (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  child_name  text        not null,
  age         int         not null,
  interests   text,
  theme       text,
  language    text        not null default 'ja',
  story_json  jsonb,      -- Dify出力（title, pages[] 等）を田中さん合意フォーマットのまま保存
  status      text        not null default 'generating'
              check (status in ('generating', 'completed', 'paid', 'failed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_books_user_id on public.books (user_id);
create index if not exists idx_books_status  on public.books (status);

-- updated_at を自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ============================== orders =====================================
-- Stripe決済の記録。1絵本 : N注文
create table if not exists public.orders (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  book_id           uuid        not null references public.books (id) on delete cascade,
  amount            int         not null,              -- 円の整数（例: 5000）
  currency          text        not null default 'jpy',
  stripe_payment_id text,
  status            text        not null default 'pending'
                    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at        timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_book_id on public.orders (book_id);
-- 同じStripe決済IDの重複登録を防止（NULLは対象外）
create unique index if not exists idx_orders_stripe_payment_id
  on public.orders (stripe_payment_id) where stripe_payment_id is not null;

-- ============================== RLS（案・要チーム確認） =====================
-- 方針：
--  ・ユーザーは「自分の行」だけ SELECT できる（他人の絵本・注文は見えない）
--  ・books の INSERT/UPDATE は、Edge Function（service_role ＝ RLSを通らない）で
--    行うなら本来ポリシー不要。ただしフロントの「タイトル編集」機能が
--    story_json.title を直接UPDATEするため、自分の行に限りUPDATEを許可する案。
--    （編集もEdge Function経由に統一するなら、下のinsert/updateポリシーは削除可）
--  ・orders への書き込みは Stripe Webhook（service_role）のみ。フロントは読むだけ。

alter table public.books  enable row level security;
alter table public.orders enable row level security;

create policy "books: 自分の絵本のみ参照"
  on public.books for select using (auth.uid() = user_id);

create policy "books: 自分の絵本のみ作成"
  on public.books for insert with check (auth.uid() = user_id);

create policy "books: 自分の絵本のみ更新"  -- タイトル編集用（要確認）
  on public.books for update using (auth.uid() = user_id);

create policy "orders: 自分の注文のみ参照"
  on public.orders for select using (auth.uid() = user_id);

-- ============================== 動作確認クエリ ==============================
-- ログイン中ユーザーで実行して、自分の絵本しか返らないことを確認（資料 Week 8 Day 5）
--   select id, child_name, status from public.books;
