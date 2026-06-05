CREATE TABLE IF NOT EXISTS diaries (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  date       date        NOT NULL,  -- 日記が対象とする日付（JST）
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS diaries_user_id_date_idx ON diaries (user_id, date DESC);
