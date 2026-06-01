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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは自分のレコードのみ参照可能
-- Discord OAuth 後、Supabase Auth の user_metadata に provider_id として Discord ID が入る
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (
    discord_id = (
      SELECT raw_user_meta_data ->> 'provider_id'
      FROM auth.users
      WHERE id = auth.uid()
    )
  );
