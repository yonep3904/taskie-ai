import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  buildTaskContext,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AIService } from "@/services/ai/ai-service";
import { generateChatReply } from "@/services/chat";
import { getRecentHistory, saveConversation } from "@/services/conversation";
import { replyToMessage } from "@/services/discord/sender";
import { extractFromMessage } from "@/services/extraction";
import {
  completeTask,
  createTask,
  findPendingTasksByTitle,
} from "@/services/task";
import { findOrCreateUser } from "@/services/user";
import type { Database, TaskRow, UserRow } from "@/types/database";

type SupabaseAdminClient = SupabaseClient<Database>;

/**
 * タスク抽出を実行し、DB を更新して登録・完了タスクを返す。
 * 返却値は AI 返答のコンテキストとして使用する。
 */
async function runTaskExtraction(
  ai: AIService,
  supabase: SupabaseAdminClient,
  user: UserRow,
  userMessage: string,
): Promise<{ registered: TaskRow[]; completed: TaskRow[] }> {
  const result = await extractFromMessage(ai, userMessage);
  console.log(
    `[Bot] 抽出結果 | newTasks: ${result.newTasks.length}, completed: ${result.completedTaskTitles.length}`,
  );

  const registered: TaskRow[] = [];
  const completed: TaskRow[] = [];

  // 新規タスクの登録
  for (const extracted of result.newTasks) {
    const task = await createTask(supabase, {
      userId: user.id,
      title: extracted.title,
      description: extracted.description ?? null,
      dueAt: extracted.due_at ?? null,
    });
    console.log(`[Bot] タスク登録 | title: ${task.title}`);
    registered.push(task);
  }

  // 完了タスクの更新
  for (const keyword of result.completedTaskTitles) {
    const tasks = await findPendingTasksByTitle(supabase, user.id, keyword);
    for (const task of tasks) {
      await completeTask(supabase, task.id);
      console.log(`[Bot] タスク完了 | title: ${task.title}`);
      completed.push(task);
    }
  }

  return { registered, completed };
}

/**
 * メッセージ受信イベントのハンドラーを生成するファクトリ関数。
 * `client.on(Events.MessageCreate, createMessageHandler(ai))` で登録する。
 *
 * ユーザーの自動登録 → タスク抽出・DB 更新 → AI 返答の生成（タスク結果を参照） →
 * 会話履歴の保存・送信 を行う。
 *
 * @param ai - 使用する AI サービス
 */
export function createMessageHandler(ai: AIService) {
  return async function onMessageCreate(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (message.system) return;

    try {
      const supabase = createAdminClient();

      const { user, isNew } = await findOrCreateUser(supabase, {
        discordId: message.author.id,
        discordUsername: message.author.username,
        displayName: message.author.displayName,
        avatarUrl: message.author.displayAvatarURL(),
      });

      if (isNew) {
        console.log(`[Bot] ユーザー登録 | discord_id: ${user.discord_id}`);
        await replyToMessage(message, WELCOME_MESSAGE);
        return;
      }

      const history = await getRecentHistory(supabase, user.id);

      // タスク抽出を先に実行し、結果を AI 返答に反映させる
      const { registered, completed } = await runTaskExtraction(
        ai,
        supabase,
        user,
        message.content,
      ).catch((error) => {
        console.error("[Bot] タスク抽出中にエラーが発生しました:", error);
        return { registered: [] as TaskRow[], completed: [] as TaskRow[] };
      });

      const taskContext = buildTaskContext(registered, completed);
      const reply = await generateChatReply(
        ai,
        history,
        message.content,
        taskContext,
      );

      await saveConversation(supabase, {
        userId: user.id,
        role: "user",
        content: message.content,
      });
      await saveConversation(supabase, {
        userId: user.id,
        role: "assistant",
        content: reply,
      });

      await replyToMessage(message, reply);
      console.log(`[Bot] 返答送信 | ユーザー: ${message.author.tag}`);
    } catch (error) {
      console.error("[Bot] メッセージ処理中にエラーが発生しました:", error);
      await replyToMessage(message, AI_UNAVAILABLE_MESSAGE).catch(() => {});
    }
  };
}
