# !/bin/bash

# リマインドを手動実行
curl -X POST http://localhost:3000/api/proactive \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-secret-here" \
  -d '{"type": "reminder"}'

# ランダム会話を手動実行
curl -X POST http://localhost:3000/api/proactive \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-secret-here" \
  -d '{"type": "random"}'

# 両方まとめて
curl -X POST http://localhost:3000/api/proactive \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-secret-here" \
  -d '{"type": "both"}'
