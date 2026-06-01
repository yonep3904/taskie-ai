import { createClient } from "@supabase/supabase-js";
import { Env } from "@/lib/env";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./config";

/**
 * サービスロールキーを使用する管理者向け Supabase クライアントを生成する。
 *
 * Bot や Server Action などサーバーサイドでのみ使用すること。
 * RLS をバイパスするため、クライアントコンポーネントで絶対にインポートしないこと。
 */
export function createAdminClient() {
  const { url } = getSupabasePublicConfig();
  return createClient<Database>(url, Env.api.supabaseServiceRoleKey);
}
