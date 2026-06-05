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
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * 指定日の AI 日記を返す。未生成の場合はその日の会話をもとに生成して返す。
 *
 * GET /api/diary?date=YYYY-MM-DD  （省略時は今日）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayJST();
  const dateParam = request.nextUrl.searchParams.get("date") ?? today;

  // 未来日は拒否
  if (dateParam > today) {
    return NextResponse.json(
      { error: "未来の日付は指定できません" },
      { status: 400 },
    );
  }

  const adminSupabase = createAdminClient();
  const diaryService = new DiaryService(adminSupabase);

  // キャッシュ済みの日記があれば即返す（不変）
  const existing = await diaryService.findByDate(user.id, dateParam);
  if (existing) {
    return NextResponse.json({
      content: existing.content,
      date: existing.date,
      cached: true,
    });
  }

  // 指定日の会話・タスク情報を収集して生成
  const conversationService = new ConversationService({}, adminSupabase);
  const taskService = new TaskService(adminSupabase);

  const [conversations, pendingTasks] = await Promise.all([
    conversationService.getHistoryForDate(user.id, dateParam),
    taskService.findPending(user.id),
  ]);

  const conversationSummary =
    conversations.length > 0
      ? conversations.map((c) => `[${c.role}] ${c.content}`).join("\n")
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
日記の日付: ${dateParam}

【この日の会話】
${conversationSummary}

【未完了のタスク】
${taskSummary}

上記をもとに${dateParam}の日記を書いてください。
`.trim();

  const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });
  const content = await aiService.generateText(
    [{ role: "user", content: instruction }],
    DIARY_SYSTEM_PROMPT,
  );

  await diaryService.save(user.id, content, dateParam);

  return NextResponse.json({ content, date: dateParam, cached: false });
}
