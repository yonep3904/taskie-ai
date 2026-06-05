/** AI サービスで扱う共通のメッセージ型 */
export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * AI に渡すために前処理済みの添付ファイル。
 * - image: 画像 URL（GPT-4o vision / Gemini インライン）
 * - document: PDF など非画像ファイルのテキスト抽出結果
 */
export type ProcessedAttachment =
  | { type: "image"; url: string; mimeType: string; filename: string }
  | { type: "document"; text: string; filename: string };

export interface AIService {
  /**
   * 会話形式でテキストを生成する。
   *
   * @param messages          - 会話履歴（ユーザー・アシスタントの交互メッセージ）
   * @param systemInstruction - システムプロンプト
   */
  generateText(
    messages: AIMessage[],
    systemInstruction?: string,
  ): Promise<string>;

  /**
   * 指定したスキーマに従った JSON オブジェクトを生成する。
   * スキーマの形式はプロバイダによって異なる場合がある。
   *
   * @param messages          - 会話履歴
   * @param systemInstruction - システムプロンプト
   * @param schema            - レスポンスの JSON スキーマ定義
   */
  generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    schema: Record<string, unknown>,
  ): Promise<T>;

  /**
   * 添付ファイル（画像・ドキュメント）を含むメッセージでテキストを生成する。
   *
   * @param userMessage      - ユーザーのテキスト（空の場合は解説を促す）
   * @param attachments      - 前処理済みの添付ファイル一覧
   * @param systemInstruction - システムプロンプト
   */
  generateTextWithAttachments(
    userMessage: string,
    attachments: ProcessedAttachment[],
    systemInstruction?: string,
  ): Promise<string>;
}
