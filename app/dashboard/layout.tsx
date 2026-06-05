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
    <div className="min-h-svh bg-zinc-50">
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
