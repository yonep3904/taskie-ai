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
}
