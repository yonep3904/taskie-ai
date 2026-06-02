import type { Content, Schema } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { type AIMessage, AIService } from "./ai-service";

const DEFAULT_MODEL = "gemini-2.5-flash";

/** リトライ対象の HTTP ステータスコード（一時的な過負荷・レート制限） */
const RETRYABLE_STATUSES = new Set([429, 503]);

/** リトライ間隔（ミリ秒） */
const RETRY_DELAY_MS = 1500;

/** 最大リトライ回数 */
const MAX_RETRIES = 2;

/**
 * Gemini API を使用する AIService の実装。
 */
export class GeminiAIService extends AIService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    super(apiKey);
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  private toContent(message: AIMessage): Content {
    return {
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    };
  }

  private isRetryable(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      RETRYABLE_STATUSES.has(error.status as number)
    );
  }

  /**
   * Gemini でテキストを生成する。503/429 エラーは最大 MAX_RETRIES 回リトライする。
   */
  async generateText(
    messages: AIMessage[],
    systemInstruction?: string,
    attempt = 0,
  ): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: messages.map((m) => this.toContent(m)),
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text;
      if (!text) throw new Error("Gemini から空のレスポンスが返されました");
      return text;
    } catch (error) {
      if (attempt < MAX_RETRIES && this.isRetryable(error)) {
        console.warn(
          `[Gemini] 一時エラー (試行 ${attempt + 1}/${MAX_RETRIES})。リトライします...`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.generateText(messages, systemInstruction, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Gemini の構造化出力機能で JSON を生成する。
   * schema は Gemini の Schema 形式で渡す。
   */
  async generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    schema: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: messages.map((m) => this.toContent(m)),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema as unknown as Schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini から空のレスポンスが返されました");
    return JSON.parse(text) as T;
  }
}
