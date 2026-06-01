import type { TaskRow } from "@/types/database";

/** 初回メッセージ時の歓迎メッセージ */
export const WELCOME_MESSAGE = "初めまして。今日からあなたの秘書を担当します。";

/** AI が一時的に応答できない場合のエラーメッセージ */
export const AI_UNAVAILABLE_MESSAGE =
  "少し込み合っています。もう一度送ってもらえますか？";

/**
 * タスク操作の結果を AI に渡すコンテキスト文字列を生成する。
 * 操作がない場合は null を返す。
 *
 * @param registered - 今回登録されたタスクの一覧
 * @param completed  - 今回完了になったタスクの一覧
 */
export function buildTaskContext(
  registered: TaskRow[],
  completed: TaskRow[],
): string | null {
  if (registered.length === 0 && completed.length === 0) return null;

  const lines: string[] = [];

  for (const task of registered) {
    const due = task.due_at
      ? `締切: ${new Date(task.due_at).toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "締切未設定";
    lines.push(`新規登録: 「${task.title}」（${due}）`);
  }

  for (const task of completed) {
    lines.push(`完了: 「${task.title}」`);
  }

  return lines.join("\n");
}
