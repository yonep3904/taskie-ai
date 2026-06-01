import type { Schema } from "@google/genai";
import { Type } from "@google/genai";
import { EXTRACTION_SYSTEM_PROMPT } from "@/constants/prompts";
import { GEMINI_MODEL, getGeminiClient } from "@/lib/ai/gemini";

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

/** Gemini に渡すレスポンススキーマ */
const EXTRACTION_SCHEMA: Schema = {
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
 * @param userMessage - 解析対象のユーザーメッセージ
 * @returns 抽出結果。解析失敗時は空の結果を返す
 */
export async function extractFromMessage(
  userMessage: string,
): Promise<ExtractionResult> {
  const ai = getGeminiClient();
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `以下のメッセージを解析してください。\n\n現在日時: ${now}\n\nメッセージ:\n${userMessage}`,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return EMPTY_RESULT;

    return JSON.parse(text) as ExtractionResult;
  } catch {
    // 抽出失敗はチャット応答に影響させない
    return EMPTY_RESULT;
  }
}
