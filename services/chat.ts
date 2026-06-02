import { CHAT_SYSTEM_PROMPT } from "@/constants/prompts";
import type { AIMessage, AIService } from "@/services/ai/ai-service";
import type { Database } from "@/types/database";

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
}
