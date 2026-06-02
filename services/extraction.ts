import { Type } from "@google/genai";
import { EXTRACTION_SYSTEM_PROMPT } from "@/constants/prompts";
import type { AIMessage, AIService } from "@/lib/ai/ai-service";

/** 抽出された新規タスク */
type ExtractedTask = {
  title: string;
  description?: string;
  due_at?: string | null;
};

/** Extraction AI の出力型 */
export type ExtractionResult = {
  newTasks: ExtractedTask[];
  completedTaskTitles: string[];
};

/** レスポンスの JSON スキーマ（Gemini 互換形式） */
const EXTRACTION_SCHEMA: Record<string, unknown> = {
  type: Type.OBJECT,
  properties: {
    newTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          due_at: { type: Type.STRING, nullable: true },
        },
        required: ["title"],
      },
    },
    completedTaskTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["newTasks", "completedTaskTitles"],
};

const EMPTY_RESULT: ExtractionResult = {
  newTasks: [],
  completedTaskTitles: [],
};

/**
 * ユーザーメッセージから新規タスクと完了タスクを抽出する。
 *
 * @param ai          - 使用する AI サービス
 * @param userMessage - 解析対象のユーザーメッセージ
 * @returns 抽出結果。解析失敗時は空の結果を返す
 */
export async function extractFromMessage(
  ai: AIService,
  userMessage: string,
): Promise<ExtractionResult> {
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  const messages: AIMessage[] = [
    {
      role: "user",
      content: `以下のメッセージを解析してください。\n\n現在日時: ${now}\n\nメッセージ:\n${userMessage}`,
    },
  ];

  try {
    return await ai.generateJSON<ExtractionResult>(
      messages,
      EXTRACTION_SYSTEM_PROMPT,
      EXTRACTION_SCHEMA,
    );
  } catch (error) {
    // 抽出失敗はチャット応答に影響させない
    console.error("[Extraction] タスク抽出中にエラーが発生しました:", error);
    return EMPTY_RESULT;
  }
}
