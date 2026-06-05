import { type NextRequest, NextResponse } from "next/server";
import { DIARY_SYSTEM_PROMPT } from "@/constants/prompts";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpenAIAIService } from "@/services/ai";
import {
  ConversationService,
  DiaryService,
  TaskService,
  UserService,
} from "@/services/db";

/** 指定日付の前日を YYYY-MM-DD 形式で返す */
function getYesterdayJST(): string {
  const d = new Date(
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
      new Date(),
    ),
  );
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 全ユーザーの昨日分の日記を一括生成する。
 * 外部 cron から毎日 00:05 JST 頃に呼ばれることを想定。
 *
 * POST /api/diary/generate
 * Headers: x-cron-secret: <CRON_SECRET>
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get("x-cron-secret");
  if (!Env.api.cronSecret || secret !== Env.api.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = getYesterdayJST();
  const supabase = createAdminClient();
  const userService = new UserService(supabase);
  const diaryService = new DiaryService(supabase);
  const conversationService = new ConversationService({}, supabase);
  const taskService = new TaskService(supabase);
  const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

  const users = await userService.findAll();

  const results: {
    userId: string;
    status: "generated" | "skipped" | "error";
    error?: string;
  }[] = [];

  await Promise.allSettled(
    users.map(async (user) => {
      try {
        // 既に日記があればスキップ（不変）
        const existing = await diaryService.findByDate(user.id, yesterday);
        if (existing) {
          results.push({ userId: user.id, status: "skipped" });
          return;
        }

        const [conversations, pendingTasks] = await Promise.all([
          conversationService.getHistoryForDate(user.id, yesterday),
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
日記の日付: ${yesterday}

【この日の会話】
${conversationSummary}

【未完了のタスク】
${taskSummary}

上記をもとに${yesterday}の日記を書いてください。
`.trim();

        const content = await aiService.generateText(
          [{ role: "user", content: instruction }],
          DIARY_SYSTEM_PROMPT,
        );

        await diaryService.save(user.id, content, yesterday);
        results.push({ userId: user.id, status: "generated" });
      } catch (err) {
        console.error(`[diary/generate] user=${user.id} error:`, err);
        results.push({
          userId: user.id,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  const generated = results.filter((r) => r.status === "generated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ date: yesterday, generated, skipped, errors });
}
