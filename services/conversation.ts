import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type SupabaseAdminClient = SupabaseClient<Database>;
type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationRole = ConversationRow["role"];

/** 取得する会話履歴の最大件数 */
const HISTORY_LIMIT = 20;

/**
 * 会話を1件保存する。
 *
 * @param supabase - 管理者クライアント
 * @param params   - ユーザーID・ロール・内容
 */
export async function saveConversation(
  supabase: SupabaseAdminClient,
  params: { userId: string; role: ConversationRole; content: string },
): Promise<void> {
  const { error } = await supabase.from("conversations").insert({
    user_id: params.userId,
    role: params.role,
    content: params.content,
  });

  if (error) {
    throw error;
  }
}

/**
 * ユーザーの直近の会話履歴を取得する。
 * AI に渡すコンテキストとして使用する。
 *
 * @param supabase - 管理者クライアント
 * @param userId   - ユーザーID
 */
export async function getRecentHistory(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw error;
  }

  // 古い順に並べ直して返す
  return (data ?? []).reverse();
}
