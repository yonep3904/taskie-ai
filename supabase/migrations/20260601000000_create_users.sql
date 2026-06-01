-- users テーブル: Discord Bot 経由で自動登録されるユーザーレコード
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id       TEXT        NOT NULL UNIQUE,
  display_name     TEXT        NOT NULL,
  discord_username TEXT        NOT NULL,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS を有効化（サービスロールキーはバイパスするため Bot の操作は影響なし）
-- RLS ポリシーは Web ダッシュボード認証実装時に追加する
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
