import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Browser Component / Client Component から利用する Supabase Client を作成する。
 */
export function createClient() {
  const { anonKey, url } = getSupabasePublicConfig();

  return createBrowserClient(url, anonKey);
}

export const supabase = createClient();
