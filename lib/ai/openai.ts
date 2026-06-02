import OpenAI from "openai";
import { type AIMessage, AIService } from "./ai-service";

const DEFAULT_MODEL = "gpt-4o";

/**
 * OpenAI API を使用する AIService の実装。
 */
export class OpenAIAIService extends AIService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    super(apiKey);
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * OpenAI Chat Completions API でテキストを生成する。
   */
  async generateText(
    messages: AIMessage[],
    systemInstruction?: string,
  ): Promise<string> {
    const systemMessages: OpenAI.ChatCompletionMessageParam[] =
      systemInstruction ? [{ role: "system", content: systemInstruction }] : [];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        ...systemMessages,
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const text = response.choices[0]?.message.content;
    if (!text) throw new Error("OpenAI から空のレスポンスが返されました");
    return text;
  }

  /**
   * OpenAI Chat Completions API で JSON を生成する。
   * json_object モードで JSON 出力を強制し、スキーマへの準拠はモデルに委ねる。
   * スキーマ引数はインターフェース互換のために受け取るが直接は使用しない。
   */
  async generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    _schema: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemInstruction },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message.content;
    if (!text) throw new Error("OpenAI から空のレスポンスが返されました");
    return JSON.parse(text) as T;
  }
}
