import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DiaryRow } from "@/types/database";

/**
 * diaries テーブルの CRUD を担当するサービス。
 * 日記はユーザー × 日付でユニーク。
 */
export class DiaryService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * 指定日の日記を取得する。存在しない場合は null を返す。
   *
   * @param userId - public.users の id
   * @param date   - YYYY-MM-DD 形式の日付
   */
  async findByDate(userId: string, date: string): Promise<DiaryRow | null> {
    const { data, error } = await this.supabaseClient
      .from("diaries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * 日記を保存する。同一ユーザー × 日付の既存レコードは上書きしない（不変）。
   *
   * @param userId  - public.users の id
   * @param content - 日記本文
   * @param date    - YYYY-MM-DD 形式の日付
   */
  async save(userId: string, content: string, date: string): Promise<DiaryRow> {
    const { data, error } = await this.supabaseClient
      .from("diaries")
      .insert({ user_id: userId, content, date })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * ユーザーの日記が存在する日付一覧を降順で返す。
   *
   * @param userId - public.users の id
   */
  async listDates(userId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from("diaries")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => r.date as string);
  }
}
