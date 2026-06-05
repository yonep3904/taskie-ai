import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { DashboardHeader } from "./_components/dashboard-header";

export const metadata: Metadata = {
  title: "ダッシュボード | Taskie",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // ミドルウェアでリダイレクトされるはずだが念のため
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="dashboard-aurora min-h-svh relative overflow-hidden">
      {/* グリッドパターン */}
      <div className="dashboard-grid pointer-events-none absolute inset-0" />

      {/* 装飾グロー */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-60 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <DashboardHeader user={user} />
      <main className="relative mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
