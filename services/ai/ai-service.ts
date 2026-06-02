/** AI サービスで扱う共通のメッセージ型 */
export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

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
}
