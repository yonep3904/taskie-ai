"use client";

import { createClient } from "@/lib/supabase/client";

type SignInWithDiscordOptions = {
  redirectTo?: string;
};

type AuthOperationResult = {
  error: Error | null;
};

/**
 * Discord OAuth で Supabase Auth のサインインを開始する。
 */
export async function signInWithDiscord(
  options?: SignInWithDiscordOptions,
): Promise<AuthOperationResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: options?.redirectTo ?? getCurrentAuthCallbackUrl(),
      scopes: "identify email",
      skipBrowserRedirect: true,
    },
    provider: "discord",
  });

  if (error) {
    return { error };
  }

  if (!data.url) {
    return {
      error: new Error(
        "Discord OAuth URL を Supabase Auth から取得できませんでした。",
      ),
    };
  }

  const validationError = validateDiscordOAuthUrl(data.url);

  if (validationError) {
    return { error: validationError };
  }

  window.location.assign(data.url);

  return { error: null };
}

/**
 * 現在の Supabase Auth セッションを終了する。
 */
export async function signOut() {
  const supabase = createClient();

  return supabase.auth.signOut();
}

function getCurrentAuthCallbackUrl(): string {
  return new URL("/auth/callback", window.location.origin).toString();
}

function validateDiscordOAuthUrl(url: string): Error | null {
  const oauthUrl = new URL(url);
  const clientId = oauthUrl.searchParams.get("client_id");

  if (!clientId) {
    return null;
  }

  if (clientId.startsWith("your-")) {
    return new Error(
      "Discord OAuth の client_id が Supabase Auth 側で未設定です。Supabase の Discord provider に実際の Client ID を設定し、Supabase local を使っている場合は再起動してください。",
    );
  }

  return null;
}
