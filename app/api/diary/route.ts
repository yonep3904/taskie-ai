import { type NextRequest, NextResponse } from "next/server";
import { DIARY_SYSTEM_PROMPT } from "@/constants/prompts";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { OpenAIAIService } from "@/services/ai";
import { ConversationService, DiaryService, TaskService } from "@/services/db";

/** JST での今日の日付を YYYY-MM-DD 形式で返す */
function getTodayJST(): string {
  // スウェーデン語のロケールを使うと ISO 8601 形式（YYYY-MM-DD）で日付がフォーマットされるため、これを利用
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * 今日の AI 日記を返す。未生成の場合は生成してから返す。
 *
 * GET /api/diary
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayJST();
  const adminSupabase = createAdminClient();
  const diaryService = new DiaryService(adminSupabase);

  // キャッシュ済みの日記があれば返す
  const existing = await diaryService.findByDate(user.id, today);
  if (existing) {
    return NextResponse.json({ content: existing.content, cached: true });
  }

  // 生成に必要なコンテキストを収集
  const conversationService = new ConversationService({}, adminSupabase);
  const taskService = new TaskService(adminSupabase);

  const [recentConversations, pendingTasks] = await Promise.all([
    conversationService.getRecentHistory(user.id, 10),
    taskService.findPending(user.id),
  ]);

  const conversationSummary =
    recentConversations.length > 0
      ? recentConversations.map((c) => `[${c.role}] ${c.content}`).join("\n")
      : "（会話なし）";

  const taskSummary =
    pendingTasks.length > 0
      ? pendingTasks
          .map(
            (t) =>
              `- ${t.title}${t.due_at ? `（期限: ${new Date(t.due_at).toLocaleDateString("ja-JP")}）` : ""}`,
          )
          .join("\n")
      : "（未完了タスクなし）";

  const instruction = `
今日の日付: ${today}

【直近の会話】
${conversationSummary}

【未完了のタスク】
${taskSummary}

上記をもとに今日の日記を書いてください。
`.trim();

  const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });
  const content = await aiService.generateText(
    [{ role: "user", content: instruction }],
    DIARY_SYSTEM_PROMPT,
  );

  await diaryService.save(user.id, content, today);

  return NextResponse.json({ content, cached: false });
}
