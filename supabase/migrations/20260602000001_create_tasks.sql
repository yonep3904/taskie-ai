-- tasks テーブル: ユーザーの課題を管理する
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  due_at       TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tasks_user_id_status_idx
  ON public.tasks (user_id, status);

CREATE INDEX IF NOT EXISTS tasks_user_id_due_at_idx
  ON public.tasks (user_id, due_at ASC NULLS LAST);

-- RLS を有効化
-- RLS ポリシーは Web ダッシュボード認証実装時に追加する
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
