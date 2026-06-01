import type { Content } from "@google/genai";
import { CHAT_SYSTEM_PROMPT } from "@/constants/prompts";
import { GEMINI_MODEL, getGeminiClient } from "@/lib/ai/gemini";
import type { Database } from "@/types/database";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

/** リトライ対象の HTTP ステータスコード（一時的な過負荷・レート制限） */
const RETRYABLE_STATUSES = new Set([429, 503]);

/** リトライ間隔（ミリ秒） */
const RETRY_DELAY_MS = 1500;

/** 最大リトライ回数 */
const MAX_RETRIES = 2;

/**
 * DB の conversations レコードを Gemini の Content 形式に変換する。
 * DB は "assistant"、Gemini は "model" を使うため変換が必要。
 */
function toGeminiContent(row: ConversationRow): Content {
  return {
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  };
}

function isRetryableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    RETRYABLE_STATUSES.has(error.status as number)
  );
}

/**
 * 会話履歴とユーザーの新規メッセージを受け取り、AI の返答を生成する。
 * 503/429 エラーは最大 MAX_RETRIES 回リトライする。
 *
 * @param history     - 直近の会話履歴（古い順）
 * @param userMessage - ユーザーの新規メッセージ
 * @param taskContext - 今回のタスク操作情報。null の場合はシステムプロンプトに追記しない
 * @param attempt     - 現在の試行回数（内部再帰用）
 */
export async function generateChatReply(
  history: ConversationRow[],
  userMessage: string,
  taskContext: string | null = null,
  attempt = 0,
): Promise<string> {
  const ai = getGeminiClient();

  const systemInstruction = taskContext
    ? `${CHAT_SYSTEM_PROMPT}\n\n## 今回のタスク操作\n${taskContext}`
    : CHAT_SYSTEM_PROMPT;

  const contents: Content[] = [
    ...history.map(toGeminiContent),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini から空のレスポンスが返されました");
    }

    return text;
  } catch (error) {
    if (attempt < MAX_RETRIES && isRetryableError(error)) {
      console.warn(
        `[Bot] Gemini 一時エラー (試行 ${attempt + 1}/${MAX_RETRIES})。リトライします...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return generateChatReply(history, userMessage, taskContext, attempt + 1);
    }
    throw error;
  }
}
