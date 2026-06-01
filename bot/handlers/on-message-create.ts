import type { Message } from "discord.js";
import { WELCOME_MESSAGE } from "@/constants/bot-messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { replyToMessage } from "@/services/discord/sender";
import { findOrCreateUser } from "@/services/user";

/**
 * メッセージ受信イベントのハンドラー。
 * `client.on(Events.MessageCreate, onMessageCreate)` で登録する。
 *
 * ユーザーの自動登録を行い、初回メッセージには歓迎メッセージを返す。
 */
export async function onMessageCreate(message: Message): Promise<void> {
  // Bot 自身のメッセージは無視する
  if (message.author.bot) return;

  // システムメッセージ（ピン留めなど）は無視する
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

    // TODO: AI応答ロジックを呼び出す
    console.log(
      `[Bot] メッセージ受信 | ユーザー: ${message.author.tag} | 内容: ${message.content.slice(0, 50)}`,
    );
  } catch (error) {
    console.error("[Bot] メッセージ処理中にエラーが発生しました:", error);
  }
}
