import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createConfig, type DefaultConfig } from "@/utils/create-config";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationRole = ConversationRow["role"];

interface ConversationServiceConfig {
  historyLimit?: number;
}

export class ConversationService {
  private static readonly DEFAULTS: DefaultConfig<ConversationServiceConfig> = {
    historyLimit: 20,
  };
  private readonly config: Required<ConversationServiceConfig>;

  constructor(
    config: ConversationServiceConfig,
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {
    this.config = createConfig(config, ConversationService.DEFAULTS);
  }

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
  async getRecentHistory(
    userId: string,
    limit?: number,
  ): Promise<ConversationRow[]> {
    const { data, error } = await this.supabaseClient
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit ?? this.config.historyLimit);

    if (error) throw error;

    // 古い順に並べ直して返す
    return (data ?? []).reverse();
  }

  /**
   * 指定日（JST）の会話履歴を古い順で取得する。
   * 当日の場合は現在時刻まで、過去日は 23:59:59 JST まで。
   *
   * @param userId - public.users の id
   * @param date   - YYYY-MM-DD 形式の JST 日付
   */
  async getHistoryForDate(
    userId: string,
    date: string,
  ): Promise<ConversationRow[]> {
    const todayJST = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());

    const startUTC = new Date(`${date}T00:00:00+09:00`).toISOString();
    const endUTC =
      date >= todayJST
        ? new Date().toISOString()
        : new Date(`${date}T23:59:59+09:00`).toISOString();

    const { data, error } = await this.supabaseClient
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}
