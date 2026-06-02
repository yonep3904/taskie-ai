/** AI サービスで扱う共通のメッセージ型 */
export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * AI サービスの抽象基底クラス。
 * API キーをコンストラクタで受け取り、テキスト生成と構造化 JSON 生成の
 * 2 つのメソッドを提供する。
 */
export abstract class AIService {
  constructor(protected readonly apiKey: string) {}

  /**
   * 会話形式でテキストを生成する。
   *
   * @param messages          - 会話履歴（ユーザー・アシスタントの交互メッセージ）
   * @param systemInstruction - システムプロンプト
   */
  abstract generateText(
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
  abstract generateJSON<T>(
    messages: AIMessage[],
    systemInstruction: string,
    schema: Record<string, unknown>,
  ): Promise<T>;
}
