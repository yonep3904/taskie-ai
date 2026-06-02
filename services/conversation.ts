import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationRole = ConversationRow["role"];

/** 取得する会話履歴の最大件数 */
const HISTORY_LIMIT = 20;

export class ConversationService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * 会話を1件保存する。
   */
  async save(params: {
    userId: string;
    role: ConversationRole;
    content: string;
  }): Promise<void> {
    const { error } = await this.supabaseClient.from("conversations").insert({
      user_id: params.userId,
      role: params.role,
      content: params.content,
    });

    if (error) throw error;
  }

  /**
   * ユーザーの直近の会話履歴を取得する。
   * AI に渡すコンテキストとして使用する。
   */
  async getRecentHistory(userId: string): Promise<ConversationRow[]> {
    const { data, error } = await this.supabaseClient
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error) throw error;

    // 古い順に並べ直して返す
    return (data ?? []).reverse();
  }
}
