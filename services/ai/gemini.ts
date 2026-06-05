import type { Content, Part, Schema } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { createConfig, type DefaultConfig } from "@/utils/create-config";
import type { AIMessage, AIService, ProcessedAttachment } from "./ai-service";

/** リトライ対象の HTTP ステータスコード（一時的な過負荷・レート制限） */
const RETRYABLE_STATUSES = new Set([429, 503]);

export interface GeminiAIServiceConfig {
  apiKey: string;
  model?: string;
  retryDelayMs?: number;
  maxRetries?: number;
}

/**
 * Gemini API を使用する AIService の実装。
 */
export class GeminiAIService implements AIService {
  private static readonly DEFAULTS: DefaultConfig<GeminiAIServiceConfig> = {
    model: "gemini-2.5-flash",
    retryDelayMs: 1500,
    maxRetries: 2,
  };
  private readonly config: Required<GeminiAIServiceConfig>;
  private readonly client: GoogleGenAI;

  constructor(config: GeminiAIServiceConfig) {
    this.config = createConfig(config, GeminiAIService.DEFAULTS);
    this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
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

  private async generateTextWithRetry(
    messages: AIMessage[],
    systemInstruction: string | undefined,
    attempt: number,
  ): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: messages.map((m) => this.toContent(m)),
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text;
      if (!text) throw new Error("Gemini から空のレスポンスが返されました");
      return text;
    } catch (error: unknown) {
      if (attempt < this.config.maxRetries && this.isRetryable(error)) {
        console.warn(
          `[Gemini] 一時エラー (試行 ${attempt + 1}/${this.config.maxRetries})。リトライします...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelayMs),
        );
        return this.generateTextWithRetry(
          messages,
          systemInstruction,
          attempt + 1,
        );
      }
      throw error;
    }
  }

  /**
   * Gemini でテキストを生成する。503/429 エラーは最大 maxRetries 回リトライする。
   */
  async generateText(
    messages: AIMessage[],
    systemInstruction?: string,
  ): Promise<string> {
    return this.generateTextWithRetry(messages, systemInstruction, 0);
  }

  /**
   * Gemini の構造化出力機能で JSON を生成する。
   * schema は Gemini の Schema 形式（type は大文字）で渡すこと。
   */
  async generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    schema: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.config.model,
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

  /**
   * 画像・ドキュメントを含むメッセージで Gemini マルチモーダルを使用してテキストを生成する。
   * 画像は URL からダウンロードして base64 インラインデータとして渡す。
   */
  async generateTextWithAttachments(
    userMessage: string,
    attachments: ProcessedAttachment[],
    systemInstruction?: string,
  ): Promise<string> {
    const parts: Part[] = [
      { text: userMessage || "このファイルを解説してください。" },
    ];

    for (const att of attachments) {
      if (att.type === "image") {
        const response = await fetch(att.url);
        const buffer = await response.arrayBuffer();
        const data = Buffer.from(buffer).toString("base64");
        parts.push({ inlineData: { mimeType: att.mimeType, data } });
      } else {
        parts.push({ text: `\n[${att.filename}の内容]\n${att.text}` });
      }
    }

    const response = await this.client.models.generateContent({
      model: this.config.model,
      contents: [{ role: "user", parts }],
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    const text = response.text;
    if (!text) throw new Error("Gemini から空のレスポンスが返されました");
    return text;
  }
}
