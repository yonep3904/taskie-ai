import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateChatReply } from "@/services/chat";
import { getRecentHistory, saveConversation } from "@/services/conversation";
import { replyToMessage } from "@/services/discord/sender";
import { findOrCreateUser } from "@/services/user";

/**
 * メッセージ受信イベントのハンドラー。
 * `client.on(Events.MessageCreate, onMessageCreate)` で登録する。
 *
 * ユーザーの自動登録 → AI 返答の生成 → 会話履歴の保存・送信 を行う。
 */
export async function onMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (message.system) return;

  try {
    const supabase = createAdminClient();

    // ユーザーを検索・自動登録
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

    // 直近の会話履歴を取得（現在のメッセージを含まない状態で取得する）
    const history = await getRecentHistory(supabase, user.id);

    // AI 返答を生成（成功してから保存する）
    const reply = await generateChatReply(history, message.content);

    // ユーザーメッセージと AI 返答を保存して Discord に送信
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
    // ユーザーにエラーを通知（通知自体が失敗しても握りつぶす）
    await replyToMessage(message, AI_UNAVAILABLE_MESSAGE).catch(() => {});
  }
}
