import { Env } from "@/lib/env";
import { cleanUrl } from "@/utils/url";

type SupabaseBrowserConfig = {
  anonKey: string;
  url: string;
};

/**
 * Supabase の公開設定を取得する。
 */
export function getSupabasePublicConfig(): SupabaseBrowserConfig {
  return {
    url: cleanUrl(Env.api.supabaseUrl),
    anonKey: Env.api.supabaseAnonKey,
  };
}

/**
 * Supabase Auth の OAuth callback URL を組み立てる。
 */
export function getAuthCallbackUrl(): string {
  return `${cleanUrl(Env.meta.siteUrl)}/auth/callback`;
}
