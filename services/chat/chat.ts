import { CHAT_SYSTEM_PROMPT } from "@/constants/prompts";
import type { AIMessage, AIService } from "@/services/ai";
import type { Database, TaskRow } from "@/types/database";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

/** DB の conversations レコードを AIMessage 形式に変換する */
function toAIMessage(row: ConversationRow): AIMessage {
  return {
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
  };
}

export class ChatService {
  constructor(private readonly aiService: AIService) {}

  /**
   * 会話履歴とユーザーの新規メッセージを受け取り、AI の返答を生成する。
   *
   * @param history     - 直近の会話履歴（古い順）
   * @param userMessage - ユーザーの新規メッセージ
   * @param taskContext - 今回のタスク操作情報。null の場合はシステムプロンプトに追記しない
   */
  async generateReply(
    history: ConversationRow[],
    userMessage: string,
    taskContext: string | null = null,
  ): Promise<string> {
    const systemInstruction = taskContext
      ? `${CHAT_SYSTEM_PROMPT}\n\n## 今回のタスク操作\n${taskContext}`
      : CHAT_SYSTEM_PROMPT;

    const messages: AIMessage[] = [
      ...history.map(toAIMessage),
      { role: "user", content: userMessage },
    ];

    return this.aiService.generateText(messages, systemInstruction);
  }

  /**
   * タスク操作の結果を AI に渡すコンテキスト文字列を生成する。
   * 操作がない場合は null を返す。
   *
   * @param registered - 今回登録されたタスクの一覧
   * @param completed  - 今回完了になったタスクの一覧
   */
  buildTaskContext(registered: TaskRow[], completed: TaskRow[]): string | null {
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
}
