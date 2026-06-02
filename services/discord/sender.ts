import type { BaseMessageOptions, Client, Message } from "discord.js";

/**
 * 送信するメッセージの内容。文字列または discord.js のメッセージオプション。
 */
export type MessageContent = string | BaseMessageOptions;

export class DiscordSenderService {
  constructor(private readonly client: Client) {}

  /**
   * 指定したチャンネルにメッセージを送信する。
   *
   * @param channelId - 送信先チャンネルの ID
   * @param content - 送信するメッセージの内容
   */
  async sendToChannel(
    channelId: string,
    content: MessageContent,
  ): Promise<Message> {
    const channel = await this.client.channels.fetch(channelId);

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
  async sendDM(userId: string, content: MessageContent): Promise<Message> {
    const user = await this.client.users.fetch(userId);
    return user.send(content);
  }

  /**
   * 受信したメッセージに返信する。
   *
   * @param message - 返信元のメッセージ
   * @param content - 送信するメッセージの内容
   */
  async replyToMessage(
    message: Message,
    content: MessageContent,
  ): Promise<Message> {
    return message.reply(content);
  }
}
