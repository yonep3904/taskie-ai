import { CHAT_SYSTEM_PROMPT, PROACTIVE_SYSTEM_PROMPT } from "@/constants/prompts";
import type { AIMessage, AIService } from "@/services/ai";
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
   * @param history          - 直近の会話履歴（古い順）
   * @param userMessage      - ユーザーの新規メッセージ
   * @param systemAdditions  - システムプロンプトに追加するテキスト（ContextService が生成）
   */
  async generateReply(
    history: ConversationRow[],
    userMessage: string,
    systemAdditions: string,
  ): Promise<string> {
    const systemInstruction = CHAT_SYSTEM_PROMPT + systemAdditions;

    const messages: AIMessage[] = [
      ...history.map(toAIMessage),
      { role: "user", content: userMessage },
    ];

    return this.aiService.generateText(messages, systemInstruction);
  }

  /**
   * 自発メッセージを生成する。ユーザーからの入力なしで AI が話しかける場合に使用する。
   *
   * @param systemAdditions - ContextService が生成したシステムプロンプト追加テキスト
   * @param instruction     - 生成の方向性を示す内部指示（AI への隠し指示）
   */
  async generateMessage(
    systemAdditions: string,
    instruction: string,
  ): Promise<string> {
    const systemInstruction = PROACTIVE_SYSTEM_PROMPT + systemAdditions;
    const messages: AIMessage[] = [{ role: "user", content: instruction }];
    return this.aiService.generateText(messages, systemInstruction);
  }
}
