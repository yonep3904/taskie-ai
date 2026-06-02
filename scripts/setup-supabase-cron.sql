-- Supabase Cron セットアップスクリプト
-- Supabase ダッシュボード > SQL Editor で実行してください
--
-- 事前準備:
--   1. Database > Extensions で "pg_cron" と "pg_net" を ON にする
--   2. 以下の変数を実際の値に書き換えてから実行する

-- ============================================================
-- 変数（ここを書き換えてください）
-- ============================================================
DO $$
DECLARE
  site_url    TEXT := 'https://your-app.vercel.app'; -- デプロイ先 URL
  cron_secret TEXT := 'your-cron-secret';            -- .env の CRON_SECRET と同じ値
BEGIN

  -- 既存のジョブを削除（再実行時の冪等性確保）
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN ('taskie-reminder', 'taskie-random-chat');

  -- 毎朝 9:00 JST (= 0:00 UTC) に締切リマインドを送信
  PERFORM cron.schedule(
    'taskie-reminder',
    '0 0 * * *',
    format(
      $sql$
      SELECT net.http_post(
        url     := %L,
        headers := '{"Content-Type": "application/json", "x-cron-secret": "%s"}'::jsonb,
        body    := '{"type": "reminder"}'::jsonb
      );
      $sql$,
      site_url || '/api/proactive',
      cron_secret
    )
  );

  -- 2時間ごとにランダム会話を送信（確率 20% は ProactiveHandler 側で制御）
  PERFORM cron.schedule(
    'taskie-random-chat',
    '0 */2 * * *',
    format(
      $sql$
      SELECT net.http_post(
        url     := %L,
        headers := '{"Content-Type": "application/json", "x-cron-secret": "%s"}'::jsonb,
        body    := '{"type": "random"}'::jsonb
      );
      $sql$,
      site_url || '/api/proactive',
      cron_secret
    )
  );

  RAISE NOTICE 'Cron ジョブを登録しました: taskie-reminder, taskie-random-chat';
END $$;

-- 登録確認
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE 'taskie-%';
