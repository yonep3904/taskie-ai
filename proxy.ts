import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PATHS = ["/dashboard"];
const LOGIN_PATH = "/login";

export async function proxy(request: NextRequest) {
  // セッション Cookie を更新する（Supabase SSR の要件）
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 保護ルートへのアクセス時は認証チェック
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const { anonKey, url } = getSupabasePublicConfig();
    // updateSession で request.cookies が更新済みのため、そこから user を確認する
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
