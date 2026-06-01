"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithDiscord, signOut } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

const AUTH_ERROR_PARAM = "auth_error";
const DEBUG_AUTH_REDIRECT_PATH = "/debug";
const DISCORD_PROVIDER = "discord";
const LOADING_LABEL = "確認中";
const SIGNED_IN_LABEL = "認証済み";
const SIGNED_OUT_LABEL = "未認証";

/**
 * Discord 認証の動作確認に使う開発環境専用 UI。
 */
export function DiscordAuthTest() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const statusLabel = useMemo(() => {
    if (isLoading) {
      return LOADING_LABEL;
    }

    return session ? SIGNED_IN_LABEL : SIGNED_OUT_LABEL;
  }, [isLoading, session]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const callbackError = searchParams.get(AUTH_ERROR_PARAM);

    if (callbackError) {
      setErrorMessage(callbackError);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMessage(error.message);
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", DEBUG_AUTH_REDIRECT_PATH);

    const { error } = await signInWithDiscord({
      redirectTo: redirectTo.toString(),
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await signOut();

    if (error) {
      setErrorMessage(error.message);
    }

    setIsSubmitting(false);
  }, []);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Discord 認証テスト</CardTitle>
        <CardDescription>
          Supabase Auth の Discord OAuth 設定とセッション状態を確認します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>認証エラー</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border bg-muted/30 p-3">
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">状態</dt>
              <dd className="font-medium">{statusLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-medium">{DISCORD_PROVIDER}</dd>
            </div>
            {session?.user ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="max-w-64 truncate font-mono text-xs">
                    {session.user.id}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="max-w-64 truncate font-medium">
                    {session.user.email ?? "未取得"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        {session ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={isLoading || isSubmitting}
          >
            サインアウト
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSignIn}
            className="bg-[#5865F2] text-white hover:bg-[#4752C4]"
            disabled={isLoading || isSubmitting}
          >
            Discord で認証
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
