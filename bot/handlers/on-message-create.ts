import type { Message } from "discord.js";

/**
 * メッセージ受信イベントのハンドラー。
 * `client.on(Events.MessageCreate, onMessageCreate)` で登録する。
 *
 * ビジネスロジックはここから呼び出す。
 */
export async function onMessageCreate(message: Message): Promise<void> {
  // Bot 自身のメッセージは無視する
  if (message.author.bot) return;

  // システムメッセージ（ピン留めなど）は無視する
  if (message.system) return;

  const isDM = message.guild === null;

  // TODO: ユーザー自動登録・AI応答など、ビジネスロジックを呼び出す
  // await handleIncomingMessage({ message, isDM });

  console.log(
    `[Bot] メッセージ受信 | ユーザー: ${message.author.tag} | DM: ${isDM} | 内容: ${message.content.slice(0, 50)}`,
  );
}
