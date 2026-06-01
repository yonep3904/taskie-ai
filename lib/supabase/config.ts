import { Env } from "@/lib/env";
import { cleanUrl } from "@/utils/url";

type SupabaseBrowserConfig = {
  anonKey: string;
  url: string;
};

/**
 * Supabase の公開設定を取得する。
 */
export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  return {
    url: cleanUrl(Env.api.supabaseUrl),
    anonKey: Env.api.supabaseAnonKey,
  };
}
