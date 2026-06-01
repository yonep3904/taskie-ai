-- conversations テーブル: Bot との会話履歴を保持する
CREATE TABLE IF NOT EXISTS public.conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_user_id_created_at_idx
  ON public.conversations (user_id, created_at DESC);

-- RLS を有効化
-- RLS ポリシーは Web ダッシュボード認証実装時に追加する
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
