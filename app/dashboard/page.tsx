import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { AIContent } from "./_components/ai-content";
import { TaskList } from "./_components/task-list";
import { TodaySummary } from "./_components/today-summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const adminSupabase = createAdminClient();

  // 全タスク（pending + overdue + completed）を取得
  const { data: allTasks } = await adminSupabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true, nullsFirst: false });

  const tasks = allTasks ?? [];

  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-7">
      {/* ページヘッダー */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{
            background:
              "linear-gradient(90deg, #818cf8 0%, #a5b4fc 60%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          おかえりなさい、{user.display_name} さん
        </h1>
        <p className="mt-1 text-sm text-slate-500">{today}</p>
      </div>

      <TodaySummary tasks={tasks} />
      <TaskList tasks={tasks} />
      <AIContent />
    </div>
  );
}
