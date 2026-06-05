"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase/auth";
import type { UserRow } from "@/types/database";

type Props = {
  user: UserRow;
};

export function DashboardHeader({ user }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    await signOut();
    window.location.href = "/login";
  }, []);

  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-900">Taskie</span>
          <span className="text-sm text-zinc-500">{user.display_name}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          ログアウト
        </Button>
      </div>
    </header>
  );
}
