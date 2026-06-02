import { REST, Routes } from "discord.js";
import type { DirectMessageSender, MessageContent } from "./sender";

/**
 * Discord REST API のみで DM を送信するクラス。
 * WebSocket 接続が不要なため、Next.js API ルートなどサーバーサイドで使用できる。
 */
export class DiscordRestSender implements DirectMessageSender {
  private readonly rest: REST;

  constructor(token: string) {
    this.rest = new REST({ version: "10" }).setToken(token);
  }

  /**
   * Discord REST API 経由で指定ユーザーに DM を送信する。
   * DM チャンネルが存在しない場合は自動的に作成する。
   */
  async sendDM(userId: string, content: MessageContent): Promise<void> {
    // DM チャンネルを作成（既存の場合は既存チャンネルを返す）
    const channel = (await this.rest.post(Routes.userChannels(), {
      body: { recipient_id: userId },
    })) as { id: string };

    const body =
      typeof content === "string" ? { content } : { content, ...content };

    await this.rest.post(Routes.channelMessages(channel.id), { body });
  }
}
