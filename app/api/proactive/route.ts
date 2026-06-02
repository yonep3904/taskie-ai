import { type NextRequest, NextResponse } from "next/server";
import { Env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpenAIAIService } from "@/services/ai";
import { ChatService, ExtractionService } from "@/services/chat";
import { ContextService } from "@/services/chat/context";
import {
  ConversationService,
  MemoryService,
  TaskService,
  UserService,
} from "@/services/db";
import { DiscordRestSender } from "@/services/discord";
import { ProactiveHandler } from "@/services/handler";

type ProactiveType = "reminder" | "random" | "both";

type RequestBody = {
  type: ProactiveType;
};

/**
 * 自発メッセージのトリガーエンドポイント。
 *
 * テスト用途のほか、Supabase Cron から本番スケジュール実行にも利用できる。
 * `x-cron-secret` ヘッダーで認証する。
 *
 * POST /api/proactive
 * Headers: x-cron-secret: <CRON_SECRET>
 * Body: { "type": "reminder" | "random" | "both" }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 認証チェック
  const secret = request.headers.get("x-cron-secret");
  if (!Env.api.cronSecret || secret !== Env.api.cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type } = body;
  if (!["reminder", "random", "both"].includes(type)) {
    return NextResponse.json(
      {
        error:
          'type は "reminder" | "random" | "both" のいずれかを指定してください',
      },
      { status: 400 },
    );
  }

  // サービスを組み立て（REST 送信を使用するため WebSocket 接続不要）
  const supabase = createAdminClient();
  const aiService = new OpenAIAIService({ apiKey: Env.api.openaiApiKey });

  const userService = new UserService(supabase);
  const conversationService = new ConversationService({}, supabase);
  const taskService = new TaskService(supabase);
  const memoryService = new MemoryService(supabase);
  const extractionService = new ExtractionService(aiService);
  const chatService = new ChatService(aiService);

  const contextService = new ContextService(
    conversationService,
    taskService,
    memoryService,
    extractionService,
  );

  const discordSender = new DiscordRestSender(Env.api.discordBotToken);

  const proactiveHandler = new ProactiveHandler(
    {},
    userService,
    contextService,
    chatService,
    discordSender,
  );

  // 実行
  try {
    if (type === "reminder" || type === "both") {
      await proactiveHandler.handleReminders();
    }
    if (type === "random" || type === "both") {
      await proactiveHandler.handleRandomChat();
    }
  } catch (error) {
    console.error("[API /api/proactive] 実行エラー:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, type });
}
