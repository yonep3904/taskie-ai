<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Taskie AI

## プロジェクト概要

Taskie は、課題管理と日常会話を通して学生生活をサポートする AI 秘書です。

ユーザーは課題の登録・管理・リマインドを行えるほか、AI との日常会話や相談を通して継続的なサポートを受けられます。

AI はユーザーの行動や会話内容を記憶し、利用を重ねることでより個人に最適化された支援を提供します。

## 要件・仕様の確認

実装前および設計変更時は必ず `/docs` を参照してください。

- 要件定義
- 画面仕様
- API仕様
- データ構造
- ユースケース
- デザインガイドライン

などのプロジェクト仕様は `/docs` を正とします。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Biome
- pnpm
- shadcn/ui
- React Icons
- Discord.js
- Gemini API
- Supabase

## 開発方針

### ライブラリの利用

必要なライブラリは積極的に導入して構いません。

以下を優先してください。

- 十分にメンテナンスされている
- 広く利用されている
- TypeScript 対応
- Next.js と相性が良い

既存ライブラリで解決できる機能については、自作実装を避けてください。

例:

- フォーム → react-hook-form
- バリデーション → zod
- 日付処理 → date-fns
- 状態管理 → Zustand
- チャート → Recharts
- アニメーション → Motion

など

### shadcn/ui

UI コンポーネントは積極的に利用してください。

必要なコンポーネントは追加して構いません。

例:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add form
```

独自実装よりも shadcn/ui を優先してください。

## ディレクトリ構成

主要ディレクトリ:

```text
app/          # ルーティングおよびページ実装
components/   # 再利用可能な UI コンポーネント
constants/    # 定数管理
docs/         # プロジェクト仕様書
hooks/        # カスタムフック
lib/          # アプリケーション共通ロジック
mocks/        # モックデータ・モックサーバー
public/       # 静的ファイル
scripts/      # 開発用スクリプト
services/     # API通信や外部サービスとの連携
tests/        # テストコード
types/        # 型定義
utils/        # 副作用を持たないユーティリティ関数
```

## コンポーネント設計

適切な粒度で分割してください。

以下は避けてください。

- 巨大な page.tsx
- 巨大な component.tsx
- 1ファイルに複数責務が混在する実装

目安:

- 200〜300行を超える場合は分割を検討
- UI とロジックは可能な限り分離
- 再利用可能な処理は hooks または lib に切り出す

ただし過剰な抽象化は避けてください。

## コメント

コメントは基本的に日本語で記述してください。

複雑な実装の場合には、コードの意図や背景を説明するコメントを追加してください。
また、関数やクラスには JSDoc コメントを付与してください。

## コーディング規約

- TypeScript を使用する
- any の使用は極力避ける
- 型安全性を優先する
- Server Component を基本とする
- Client Component は必要時のみ使用する
- 型定義を明示する
- マジックナンバーを避ける
- ハードコード文字列を避ける

## 実装完了時の確認事項

タスク完了時は必ず以下を実行してください。

```bash
pnpm check

pnpm typecheck
```

両方が成功することを確認してください。

エラーが残った状態で完了扱いにしないでください。

---

## 品質基準

実装時は以下を意識してください。

- 可読性
- 保守性
- 型安全性
- 再利用性
- パフォーマンス

短期的な実装よりも長期的な保守性を優先してください。
