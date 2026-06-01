import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import { createAdminClient } from "@/lib/supabase/admin";
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
import type { Database, UserRow } from "@/types/database";

type SupabaseAdminClient = SupabaseClient<Database>;

/**
 * タスク抽出をバックグラウンドで実行し、DB を更新する。
 * 通知は行わない。チャット返答をブロックしないよう void で呼び出す。
 */
async function runTaskExtraction(
  supabase: SupabaseAdminClient,
  user: UserRow,
  userMessage: string,
): Promise<void> {
  const result = await extractFromMessage(userMessage);

  // 新規タスクの登録
  for (const extracted of result.newTasks) {
    const task = await createTask(supabase, {
      userId: user.id,
      title: extracted.title,
      description: extracted.description ?? null,
      dueAt: extracted.due_at ?? null,
    });
    console.log(`[Bot] タスク登録 | title: ${task.title}`);
  }

  // 完了タスクの更新
  for (const keyword of result.completedTaskTitles) {
    const tasks = await findPendingTasksByTitle(supabase, user.id, keyword);
    for (const task of tasks) {
      await completeTask(supabase, task.id);
      console.log(`[Bot] タスク完了 | title: ${task.title}`);
    }
  }
}

/**
 * メッセージ受信イベントのハンドラー。
 * `client.on(Events.MessageCreate, onMessageCreate)` で登録する。
 *
 * ユーザーの自動登録 → AI 返答の生成 → 会話履歴の保存 →
 * バックグラウンドでタスク抽出 を行う。
 */
export async function onMessageCreate(message: Message): Promise<void> {
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
    const reply = await generateChatReply(history, message.content);

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

    // タスク抽出はチャット返答をブロックしない
    void runTaskExtraction(supabase, user, message.content).catch((error) => {
      console.error("[Bot] タスク抽出中にエラーが発生しました:", error);
    });
  } catch (error) {
    console.error("[Bot] メッセージ処理中にエラーが発生しました:", error);
    await replyToMessage(message, AI_UNAVAILABLE_MESSAGE).catch(() => {});
  }
}
