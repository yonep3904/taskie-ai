import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UserService } from "@/services/db";

const DEFAULT_REDIRECT_PATH = "/";

/**
 * Supabase Auth が OAuth Provider から受け取った code をセッション Cookie に交換し、
 * public.users にユーザーレコードを upsert する。
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

    // 認証成功後、public.users にレコードを upsert する。
    // RLS をバイパスするため admin クライアントを使用。
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const discordId =
        (user.user_metadata?.provider_id as string | undefined) ?? null;

      if (discordId) {
        const adminSupabase = createAdminClient();
        const userService = new UserService(adminSupabase);
        await userService
          .findOrCreate({
            discordId,
            discordUsername:
              (user.user_metadata?.user_name as string | undefined) ??
              (user.user_metadata?.full_name as string | undefined) ??
              discordId,
            displayName:
              (user.user_metadata?.full_name as string | undefined) ??
              (user.user_metadata?.user_name as string | undefined) ??
              discordId,
            avatarUrl:
              (user.user_metadata?.avatar_url as string | undefined) ?? null,
          })
          .catch(() => {
            // ユーザー作成失敗はログインを妨げない
          });
      }
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
