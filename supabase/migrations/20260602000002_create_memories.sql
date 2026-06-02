-- memories テーブル: AI がユーザーから学習した長期記憶を保持する
CREATE TABLE IF NOT EXISTS public.memories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  importance  TEXT        NOT NULL DEFAULT 'medium'
                          CHECK (importance IN ('high', 'medium', 'low')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memories_user_id_importance_idx
  ON public.memories (user_id, importance, updated_at DESC);

-- RLS を有効化
-- RLS ポリシーは Web ダッシュボード認証実装時に追加する
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
