import { type NextRequest, NextResponse } from "next/server";
import { AI_COMMENT_SYSTEM_PROMPT } from "@/constants/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { Env } from "@/lib/env";
import { OpenAIAIService } from "@/services/ai";
import { TaskService } from "@/services/db";

/**
 * 現在のタスク状況に基づいた AI コメントを生成して返す。
 *
 * GET /api/ai-comment
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const taskService = new TaskService(adminSupabase);
  const pendingTasks = await taskService.findPending(user.id);

  const now = Date.now();
  const urgentCount = pendingTasks.filter((t) => {
    if (!t.due_at) return false;
    const days = (new Date(t.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  }).length;

  const taskSummary =
    pendingTasks.length > 0
      ? `未完了タスク: ${pendingTasks.length} 件（うち締切3日以内: ${urgentCount} 件）\n` +
        pendingTasks
          .slice(0, 5)
          .map(
            (t) =>
              `- ${t.title}${t.due_at ? `（期限: ${new Date(t.due_at).toLocaleDateString("ja-JP")}）` : ""}`,
          )
          .join("\n")
      : "現在、未完了タスクはありません。";

  const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });
  const comment = await aiService.generateText(
    [{ role: "user", content: taskSummary }],
    AI_COMMENT_SYSTEM_PROMPT,
  );

  return NextResponse.json({ comment });
}
