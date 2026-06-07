"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi2";
import { Toggle } from "@/components/ui/toggle";

/** ダーク/ライトモード切り替えトグルボタン */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      size="sm"
      aria-label="ダーク/ライトモード切り替え"
      className="border border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white data-[state=on]:bg-white/10 data-[state=on]:text-white"
    >
      {isDark ? (
        <HiMoon className="size-3.5" />
      ) : (
        <HiSun className="size-3.5" />
      )}
    </Toggle>
  );
}
