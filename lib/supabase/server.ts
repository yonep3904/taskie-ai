import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Server Component / Route Handler / Server Action から利用する Supabase Client を作成する。
 */
export async function createClient() {
  const { anonKey, url } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component では Cookie を書き込めないため、Proxy 側の更新に任せる。
        }
      },
    },
  });
}
