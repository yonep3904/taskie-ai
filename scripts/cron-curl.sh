#!/bin/bash
# 手動実行・定期実行 API のリファレンス
#
# 本番環境: BASE_URL を変更して使用
# ローカル: http://localhost:3000

BASE_URL="${BASE_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-your-secret-here}"

# -------------------------------------------------------------------
# /api/proactive  タスクリマインド・自発メッセージのトリガー
# -------------------------------------------------------------------

# リマインドのみ実行（締切が近いタスクを持つユーザーに送信）
curl -X POST "$BASE_URL/api/proactive" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{"type": "reminder"}'

# ランダム会話のみ実行（確率でユーザーに話しかける）
curl -X POST "$BASE_URL/api/proactive" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{"type": "random"}'

# リマインド + ランダム会話を両方実行
curl -X POST "$BASE_URL/api/proactive" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{"type": "both"}'

# -------------------------------------------------------------------
# /api/diary/generate  全ユーザーの昨日分日記を一括生成
#   推奨実行タイミング: 毎日 00:05 JST（日付が変わった直後）
#   既に日記がある日は上書きせずスキップする
# -------------------------------------------------------------------

curl -X POST "$BASE_URL/api/diary/generate" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET"
