import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserService } from "@/services/db";
import type { Database, UserRow } from "@/types/database";

/**
 * Supabase Auth セッションから Discord ID を取得する。
 * Discord OAuth では user_metadata.provider_id に Discord ユーザー ID が入る。
 */
function getDiscordId(
  user: NonNullable<
    Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>["data"]["user"]
  >,
): string | null {
  const providerId = user.user_metadata?.provider_id as string | undefined;
  if (providerId) return providerId;

  const identity = user.identities?.find((i) => i.provider === "discord");
  return (identity?.identity_data?.provider_id as string | undefined) ?? null;
}

/**
 * Supabase Auth のセッションを元に public.users の行を返す。
 * 未ログイン・ユーザーレコード未存在の場合は null を返す。
 *
 * DB クエリは RLS をバイパスする admin クライアントで実行する。
 * RLS ポリシーが未設定のため、通常クライアントではクエリが遮断される。
 */
export async function getCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<UserRow | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const discordId = getDiscordId(user);
  if (!discordId) return null;

  const adminSupabase = createAdminClient();
  const userService = new UserService(adminSupabase);
  return userService.findByDiscordId(discordId);
}
