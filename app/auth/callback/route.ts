import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/";

/**
 * Supabase Auth が OAuth Provider から受け取った code をセッション Cookie に交換する
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (oauthError) {
    return NextResponse.redirect(
      buildRedirectUrlWithAuthError(requestUrl, next, oauthError),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        buildRedirectUrlWithAuthError(requestUrl, next, error.message),
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

/**
 * OAuth 認証フローで発生したエラーをクエリパラメータに付与してリダイレクト URL を組み立てる
 */
function buildRedirectUrlWithAuthError(
  requestUrl: URL,
  next: string,
  errorMessage: string,
): URL {
  const redirectUrl = new URL(next, requestUrl.origin);

  redirectUrl.searchParams.set("auth_error", errorMessage);

  return redirectUrl;
}

/**
 * `next` クエリパラメータが安全なリダイレクト先であるか検査する
 */
function getSafeRedirectPath(next: string | null): string {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return next;
}
