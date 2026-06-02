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
import { DiscordRestSender } from "@/services/discord/rest-sender";
import { ProactiveHandler } from "@/services/handler";

type ProactiveType = "reminder" | "random" | "both";

type RequestBody = {
  type: ProactiveType;
};

/**
 * 自発メッセージのトリガーエンドポイント。Supabase Cron からスケジュール実行される。
 *
 * - reminder: 全ユーザーの締切タスクをチェックし、該当者にのみ送信する
 * - random: 全ユーザーに対して設定確率（デフォルト 20%）でユーザーごとに判定し送信する
 * - both: 上記を両方実行する
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
