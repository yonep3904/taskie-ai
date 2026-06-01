import type { BaseMessageOptions, Message } from "discord.js";
import { getDiscordClient } from "./client";

/**
 * 送信するメッセージの内容。文字列または discord.js のメッセージオプション。
 */
export type MessageContent = string | BaseMessageOptions;

/**
 * 指定したチャンネルにメッセージを送信する。
 *
 * @param channelId - 送信先チャンネルの ID
 * @param content - 送信するメッセージの内容
 */
export async function sendToChannel(
  channelId: string,
  content: MessageContent,
): Promise<Message> {
  const client = getDiscordClient();
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isSendable()) {
    throw new Error(
      `Channel "${channelId}" はメッセージを送信できるチャンネルではありません`,
    );
  }

  return channel.send(content);
}

/**
 * 指定したユーザーに DM を送信する。
 *
 * @param userId - 送信先ユーザーの Discord ID
 * @param content - 送信するメッセージの内容
 */
export async function sendDM(
  userId: string,
  content: MessageContent,
): Promise<Message> {
  const client = getDiscordClient();
  const user = await client.users.fetch(userId);
  return user.send(content);
}

/**
 * 受信したメッセージに返信する。
 *
 * @param message - 返信元のメッセージ
 * @param content - 送信するメッセージの内容
 */
export async function replyToMessage(
  message: Message,
  content: MessageContent,
): Promise<Message> {
  return message.reply(content);
}
