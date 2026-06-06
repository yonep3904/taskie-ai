# Taskie AI

Discord をインターフェースとした、大学生向け AI 秘書アプリです。  
会話から課題を自動登録し、リマインドや日常会話を通してユーザーの学生生活をサポートします。  
Web ダッシュボードからも課題の状況・AI 日記・AI コメントを確認できます。

## 機能

- **AI チャット（Discord）** — 雑談・相談・課題登録・課題解説
- **課題の自動抽出** — 会話から課題を自動登録・管理・状態追跡
- **PDF・画像対応** — 課題ファイルをそのまま送ると解説・ヒントを返す
- **長期記憶** — 学年・興味分野などを AI が記憶し、後日の会話に活用
- **自発的な通知** — 期限が近い課題を「通知」ではなく会話として送信
- **ランダム会話** — AI が自発的に話しかけてくる（1日 2〜5 回程度）
- **Web ダッシュボード** — 課題一覧・完了進捗・AI コメント・AI 日記（日付ナビゲーター付き）

## アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                           User                               │
└──────────────────────────────────────────────────────────────┘
         ↕ Discord（WebSocket: 返信）     ↕ Discord（REST API: 自発メッセージ）, Browser（HTTP）
┌─────────────────────┐      ┌─────────────────────────────────┐
│  Discord Bot (返信) │      │  Next.js（Vercel）              │
│  bot/               │      │  app/                           │
│  - メッセージ受信   │      │  - Web ダッシュボード           │
│   (常時起動が必要)  │      │  - /api/proactive               │
└─────────┬───────────┘      │  - /api/diary/generate          │
          |                  └─────┬────────┬──────────────────┘
          |                        |        |
          v                        |        | CRON・手動 トリガー（HTTP POST）
      ┌──────────────────┐         |        | POST /api/proactive （リマインド・ランダム会話）
      │ Supabase         │<--------+        | POST /api/diary/generate （日記一括生成）
      │ DB + Auth + Cron │                  |
      │                  │------------------+
      └──────────────────┘                  |
                                            |
┌──────────────────────────────────────────────────────────────┐
│                           Admin                              │
└──────────────────────────────────────────────────────────────┘

```

- **Next.js アプリ** はサーバーレスで動作するため **Vercel** にデプロイできます
- **Discord Bot プロセス** は WebSocket 常時接続が必要なため、**別の常時起動サーバー** が必要です
- スケジュール実行は **Supabase Cron** が Next.js の API を叩く方式で動作します

## 技術スタック

| 分類                   | 技術                                               |
| ---------------------- | -------------------------------------------------- |
| フレームワーク         | Next.js 16（App Router）                           |
| 言語                   | TypeScript                                         |
| スタイリング           | Tailwind CSS v4 / shadcn/ui / React Icons / Motion |
| DB / Auth              | Supabase（PostgreSQL + RLS）                       |
| AI                     | OpenAI API（GPT-4o）or Gemini API                  |
| Bot                    | discord.js v14                                     |
| パッケージマネージャー | pnpm                                               |
| Linter / Formatter     | Biome                                              |

---

## ローカル開発

### 前提条件

- Node.js 20 以上
- pnpm
- Docker（Supabase ローカル環境用）
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yonep3904/taskie-ai.git
cd taskie-ai

# 2. 依存関係をインストール
pnpm install

# 3. 環境変数ファイルを作成
cp .env.example .env.local
# .env.local を編集して各値を設定（後述の「環境変数」を参照）

# 4. Supabase ローカル環境を起動
supabase start

# 5. マイグレーションを適用（DB の初期化）
supabase db reset

# 6. 開発サーバーを起動
pnpm dev
```

`http://localhost:3000` でアクセスできます。

### Discord Bot をローカルで起動

```bash
pnpm bot:dev
```

Bot プロセスは Next.js とは独立しています。  
両方を起動することでフル機能を確認できます。

---

## デプロイ

推奨構成: **Vercel（Next.js）+ Supabase（DB）+ Railway（Bot）**

### 1. Supabase（本番 DB）の準備

1. [Supabase](https://supabase.com) でプロジェクトを作成する
2. ローカルから本番へマイグレーションを適用する

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. ダッシュボードの **Project Settings > API** から以下を取得しておく
   - Project URL
   - anon（public）キー
   - service_role キー

### 2. Vercel（Next.js アプリ）へのデプロイ

1. [Vercel](https://vercel.com) でリポジトリをインポートする
2. **Environment Variables** に後述の環境変数をすべて設定する
3. デプロイを実行する

   | 設定項目         | 値             |
   | ---------------- | -------------- |
   | Build Command    | `pnpm build`   |
   | Output Directory | `.next`        |
   | Install Command  | `pnpm install` |

> **タイムアウトについて**  
> OpenAI を呼ぶ API ルートは応答に数秒〜十数秒かかることがあります。  
> ユーザー数が多い場合は Vercel **Pro プラン**（300 秒）を推奨します。

### 3. Railway（Discord Bot）へのデプロイ

Discord Bot は WebSocket 常時接続が必要なため、常時起動のサーバーを用意します。  
[Railway](https://railway.app) は Discord Bot のデプロイに適しており、設定が簡単です。

1. Railway でプロジェクトを作成し、リポジトリを接続する
2. **Variables** に後述の環境変数を設定する
3. 起動コマンドを設定する

   | 設定項目      | 値               |
   | ------------- | ---------------- |
   | Start Command | `pnpm bot:start` |

Railway 以外でも [Fly.io](https://fly.io)・[Render](https://render.com)・VPS 等で同様に動作します。

### 4. Supabase Cron のセットアップ

リマインドや日記の自動生成は、Supabase Cron から Next.js の API を叩く方式で動作します。

1. Supabase ダッシュボードの **Database > Extensions** で `pg_cron` と `pg_net` を有効化する
2. `scripts/setup-supabase-cron.sql` の先頭にある変数を書き換える

   ```sql
   site_url    TEXT := 'https://your-app.vercel.app';
   cron_secret TEXT := 'your-cron-secret';
   ```

3. SQL Editor で実行する

登録されるジョブ：

| ジョブ名             | スケジュール  | 内容                           |
| -------------------- | ------------- | ------------------------------ |
| `taskie-reminder`    | 毎日 9:00 JST | 締切が近い課題をユーザーに通知 |
| `taskie-random-chat` | 2 時間ごと    | ランダムな自発会話を送信       |

**日記の自動生成** は `setup-supabase-cron.sql` に未登録です。  
同スクリプトに以下を追記して実行してください。

```sql
-- 毎日 0:05 JST（= 前日 15:05 UTC）に全ユーザーの昨日分日記を生成
PERFORM cron.schedule(
  'taskie-diary-generate',
  '5 15 * * *',
  format(
    $sql$
    SELECT net.http_post(
      url     := %L,
      headers := '{"Content-Type": "application/json", "x-cron-secret": "%s"}'::jsonb
    );
    $sql$,
    site_url || '/api/diary/generate',
    cron_secret
  )
);
```

---

## 環境変数

`.env.example` をコピーして設定してください。  
Vercel・Railway それぞれのダッシュボードで同じ変数を設定します。

| 変数名                          | 必須 | 説明                                                             |
| ------------------------------- | ---- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | ✅   | デプロイ(Next.js 側) 先 URL（例: `https://your-app.vercel.app`） |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅   | Supabase の Project URL                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅   | Supabase の anon（public）キー                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅   | Supabase の service_role キー（RLS バイパス用）                  |
| `DISCORD_CLIENT_ID`             | ✅   | Discord アプリの Client ID                                       |
| `DISCORD_BOT_TOKEN`             | ✅   | Discord Bot トークン                                             |
| `OPENAI_API_KEY`                | ✅   | OpenAI API キー                                                  |
| `CRON_SECRET`                   | ✅   | Cron エンドポイントの認証用シークレット（任意の文字列）          |
| `GEMINI_API_KEY`                | —    | Gemini API キー（現在未使用・将来用）                            |

### Discord Bot の設定

[Discord Developer Portal](https://discord.com/developers/applications) で以下を設定してください。

- **Privileged Gateway Intents**: `Message Content Intent`・`Server Members Intent` を有効化
- **Bot Permissions**: `Send Messages`・`Read Message History`・`Read Messages/View Channels`

---

## 手動実行・Cron API リファレンス

`scripts/cron-curl.sh` に主要 API の curl コマンドをまとめています。  
ローカルでの動作確認や本番での手動トリガーに使用してください。

```bash
# 環境変数を指定して実行
BASE_URL=https://your-app.vercel.app CRON_SECRET=your-secret bash scripts/cron-curl.sh
```

---

## カスタマイズ

### AI の性格・口調を変更する

`constants/prompts.ts` の先頭にある `CHAT_CHARACTER` と `CHAT_TONE` を編集するだけで、  
AI の性格・口調をまとめて変更できます。  
日記・コメント・プロアクティブメッセージ用のプロンプトも同ファイルに集約されています。

`constants/bot-messages.ts` では Bot が送る固定メッセージ（初回挨拶・エラー文など）を変更できます。

---

## プロジェクト構成

```
.
├── app/                        # Next.js アプリ（ページ・API ルート）
│   ├── api/
│   │   ├── ai-comment/         # AI コメント生成
│   │   ├── diary/              # 日記取得・生成
│   │   │   ├── dates/          # 日記が存在する日付一覧
│   │   │   └── generate/       # 全ユーザー分の一括生成（cron 用）
│   │   └── proactive/          # リマインド・ランダム会話トリガー（cron 用）
│   └── dashboard/              # Web ダッシュボード
├── bot/                        # Discord Bot プロセス（常時起動）
│   ├── handlers/
│   └── scheduler.ts            # node-cron（ローカル開発用）
├── components/ui/              # shadcn/ui コンポーネント
├── constants/                  # プロンプト・メッセージ定数（性格変更はここ）
├── docs/                       # プロジェクト仕様書
├── lib/                        # 共通ライブラリ（Supabase クライアント等）
├── scripts/
│   ├── cron-curl.sh            # 手動実行用 curl リファレンス
│   └── setup-supabase-cron.sql # Supabase Cron 登録スクリプト
├── services/
│   ├── ai/                     # AI サービス（OpenAI, Gemini）
│   ├── chat/                   # チャット・情報抽出ロジック
│   ├── db/                     # DB アクセス（タスク・会話・記憶・日記）
│   ├── discord/                # Discord クライアント・送信
│   └── handler/                # メッセージ・プロアクティブハンドラー
├── supabase/migrations/        # DB マイグレーション
└── types/                      # 型定義
```
