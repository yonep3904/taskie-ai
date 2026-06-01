import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRow } from "@/types/database";

type SupabaseAdminClient = SupabaseClient<Database>;

type FindOrCreateUserParams = {
  discordId: string;
  displayName: string;
  avatarUrl?: string | null;
};

type FindOrCreateUserResult = {
  user: UserRow;
  /** 今回の呼び出しで新規作成された場合 true */
  isNew: boolean;
};

/**
 * Discord ID でユーザーを検索し、存在しなければ新規作成する。
 *
 * @param supabase - 管理者クライアント（サービスロールキー使用）
 * @param params   - Discord ユーザー情報
 */
export async function findOrCreateUser(
  supabase: SupabaseAdminClient,
  params: FindOrCreateUserParams,
): Promise<FindOrCreateUserResult> {
  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("discord_id", params.discordId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return { user: existing, isNew: false };
  }

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      discord_id: params.discordId,
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
