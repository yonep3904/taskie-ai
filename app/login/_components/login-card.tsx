"use client";

import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithDiscord } from "@/lib/supabase/auth";

export function LoginCard() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/dashboard");

    const { error } = await signInWithDiscord({
      redirectTo: redirectTo.toString(),
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  }, []);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Taskie</CardTitle>
        <CardDescription>
          Discord アカウントでログインしてダッシュボードにアクセスします
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Button
          className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
          onClick={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? "リダイレクト中..." : "Discord でログイン"}
        </Button>
      </CardContent>
    </Card>
  );
}
