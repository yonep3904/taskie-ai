import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRow } from "@/types/database";

type FindOrCreateParams = {
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatarUrl?: string | null;
};

type FindOrCreateResult = {
  user: UserRow;
  /** 今回の呼び出しで新規作成された場合 true */
  isNew: boolean;
};

export class UserService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * Discord ID でユーザーを検索し、存在しなければ新規作成する。
   */
  async findOrCreate(params: FindOrCreateParams): Promise<FindOrCreateResult> {
    const { data: existing, error: findError } = await this.supabaseClient
      .from("users")
      .select("*")
      .eq("discord_id", params.discordId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      return { user: existing, isNew: false };
    }

    const { data: created, error: createError } = await this.supabaseClient
      .from("users")
      .insert({
        discord_id: params.discordId,
        discord_username: params.discordUsername,
        display_name: params.displayName,
        avatar_url: params.avatarUrl ?? null,
      })
      .select()
      .single();

    if (createError || !created) {
      throw createError ?? new Error("ユーザーの作成に失敗しました");
    }

    return { user: created, isNew: true };
  }
}
