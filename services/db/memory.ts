import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MemoryImportance, MemoryRow } from "@/types/database";

/** チャットのコンテキストとして取得する記憶の最大件数 */
const MEMORY_FETCH_LIMIT = 30;

export class MemoryService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * ユーザーの記憶を重要度・更新日時の降順で取得する。
   */
  async findAll(userId: string): Promise<MemoryRow[]> {
    const { data, error } = await this.supabaseClient
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(MEMORY_FETCH_LIMIT);

    if (error) throw error;

    return data ?? [];
  }

  /**
   * 新しい記憶を保存する。
   */
  async save(
    userId: string,
    content: string,
    importance: MemoryImportance,
  ): Promise<MemoryRow> {
    const { data, error } = await this.supabaseClient
      .from("memories")
      .insert({ user_id: userId, content, importance })
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error("記憶の保存に失敗しました");
    }

    return data;
  }
}
