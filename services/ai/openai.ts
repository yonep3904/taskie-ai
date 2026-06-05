import OpenAI from "openai";
import { createConfig, type DefaultConfig } from "@/utils/create-config";
import type { AIMessage, AIService, ProcessedAttachment } from "./ai-service";

export interface OpenAIAIServiceConfig {
  apiKey: string;
  model?: string;
}

/**
 * OpenAI API を使用する AIService の実装。
 */
export class OpenAIAIService implements AIService {
  private static readonly DEFAULTS: DefaultConfig<OpenAIAIServiceConfig> = {
    model: "gpt-4o",
  };
  private readonly config: Required<OpenAIAIServiceConfig>;
  private readonly client: OpenAI;

  constructor(config: OpenAIAIServiceConfig) {
    this.config = createConfig(config, OpenAIAIService.DEFAULTS);
    this.client = new OpenAI({ apiKey: this.config.apiKey });
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
      model: this.config.model,
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
   * json_object モードを使用する。このモードは API の要件として
   * システムプロンプトに "json" という単語が含まれている必要があるため、
   * systemInstruction に JSON 出力の指示を自動で追記する。
   */
  async generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    _schema: Record<string, unknown>,
  ): Promise<T> {
    const systemWithJson = `${systemInstruction}\n\n必ずJSON形式で応答してください。`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: "system", content: systemWithJson },
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

  /**
   * 画像・ドキュメントを含むメッセージで GPT-4o vision を使用してテキストを生成する。
   * 画像は URL を直接渡し、ドキュメントは抽出済みテキストを埋め込む。
   */
  async generateTextWithAttachments(
    userMessage: string,
    attachments: ProcessedAttachment[],
    systemInstruction?: string,
  ): Promise<string> {
    const textPart: OpenAI.ChatCompletionContentPartText = {
      type: "text",
      text: userMessage || "このファイルを解説してください。",
    };

    const fileParts: OpenAI.ChatCompletionContentPart[] = attachments.map(
      (att) => {
        if (att.type === "image") {
          return {
            type: "image_url",
            image_url: { url: att.url },
          } satisfies OpenAI.ChatCompletionContentPartImage;
        }
        return {
          type: "text",
          text: `\n[${att.filename}の内容]\n${att.text}`,
        } satisfies OpenAI.ChatCompletionContentPartText;
      },
    );

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      ...(systemInstruction
        ? [{ role: "system" as const, content: systemInstruction }]
        : []),
      { role: "user", content: [textPart, ...fileParts] },
    ];

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
    });

    const text = response.choices[0]?.message.content;
    if (!text) throw new Error("OpenAI から空のレスポンスが返されました");
    return text;
  }
}
