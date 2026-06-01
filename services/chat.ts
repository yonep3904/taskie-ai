import type { Content } from "@google/genai";
import { GEMINI_MODEL, getGeminiClient } from "@/lib/ai/gemini";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { Database } from "@/types/database";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

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

/**
 * 会話履歴とユーザーの新規メッセージを受け取り、AI の返答を生成する。
 *
 * @param history     - 直近の会話履歴（古い順）
 * @param userMessage - ユーザーの新規メッセージ
 * @returns AI の返答テキスト
 */
export async function generateChatReply(
  history: ConversationRow[],
  userMessage: string,
): Promise<string> {
  const ai = getGeminiClient();

  const contents: Content[] = [
    ...history.map(toGeminiContent),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction: CHAT_SYSTEM_PROMPT },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini から空のレスポンスが返されました");
  }

  return text;
}
