"use client";

import { useCallback, useState } from "react";
import { HiSparkles } from "react-icons/hi2";
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

  const initial = user.display_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: "rgba(3, 7, 18, 0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* ロゴ */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                boxShadow: "0 0 20px rgba(99,102,241,0.4)",
              }}
            >
              <HiSparkles className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-lg font-bold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #a5b4fc 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Taskie
            </span>
          </div>

          <div
            className="hidden h-4 w-px sm:block"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />

          {/* ユーザーアバター */}
          <div className="hidden items-center gap-2 sm:flex">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              }}
            >
              {initial}
            </div>
            <span className="text-sm text-slate-300">{user.display_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ログアウトボタン */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
          >
            {isLoading ? "処理中..." : "ログアウト"}
          </Button>
        </div>
      </div>
    </header>
  );
}
