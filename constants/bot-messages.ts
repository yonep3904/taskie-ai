/** 初回メッセージ時の歓迎メッセージ */
export const WELCOME_MESSAGE = "初めまして。今日からあなたの秘書を担当します。";

/** AI が一時的に応答できない場合のエラーメッセージ */
export const AI_UNAVAILABLE_MESSAGE =
  "少し込み合っています。もう一度送ってもらえますか？";

/**
 * タスク登録通知メッセージを生成する。
 * @param title  - タスクのタイトル
 * @param dueAt  - 締切日時（ISO 8601）。null の場合は未設定
 */
export function buildTaskRegisteredMessage(
  title: string,
  dueAt: string | null,
): string {
  const due = dueAt
    ? `締切: ${new Date(dueAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : "締切未設定";
  return `また増えたんですか。「${title}」を課題として登録しました。${due}`;
}

/** タスク完了通知メッセージ */
export const TASK_COMPLETED_MESSAGE = (title: string) =>
  `珍しく仕事が早いですね。「${title}」を完了にしました。`;
