import { GoogleGenAI } from "@google/genai";
import { Env } from "@/lib/env";

/** 使用するモデル名 */
const GEMINI_MODEL = "gemini-2.5-flash";

let _client: GoogleGenAI | null = null;

/**
 * Gemini クライアントのシングルトンを返す。
 */
export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: Env.api.geminiApiKey });
  }
  return _client;
}

export { GEMINI_MODEL };
