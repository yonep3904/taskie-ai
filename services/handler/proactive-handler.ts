import type { ChatService } from "@/services/chat";
import type { ContextService } from "@/services/chat/context";
import type { UserService } from "@/services/db";
import type { DiscordSenderService } from "@/services/discord";
import type { UserRow } from "@/types/database";
import { createConfig, type DefaultConfig } from "@/utils/create-config";

/** 締切リマインドを送信する日数の閾値（複数該当しても1通のみ送信） */
const REMINDER_THRESHOLD_DAYS = [1, 3] as const;

export interface ProactiveHandlerConfig {
  /** ランダム会話の送信確率（0〜1、デフォルト: 0.2） */
  randomChatProbability?: number;
}

/**
 * 自発メッセージ（締切リマインド・ランダム会話）を全ユーザーに送信するハンドラー。
 * スケジューラーから定期的に呼び出される。
 */
export class ProactiveHandler {
  private static readonly DEFAULTS: DefaultConfig<ProactiveHandlerConfig> = {
    randomChatProbability: 0.2,
  };
  private readonly config: Required<ProactiveHandlerConfig>;

  constructor(
    config: ProactiveHandlerConfig,
    private readonly userService: UserService,
    private readonly contextService: ContextService,
    private readonly chatService: ChatService,
    private readonly discordSenderService: DiscordSenderService,
  ) {
    this.config = createConfig(config, ProactiveHandler.DEFAULTS);
  }

  /**
   * 全ユーザーの締切が近い課題を確認し、該当者にリマインドを送信する。
   */
  async handleReminders(): Promise<void> {
    const users = await this.userService.findAll();
    console.log(
      `[Proactive] リマインドチェック開始 | 対象ユーザー: ${users.length} 人`,
    );

    for (const user of users) {
      await this.sendReminderIfNeeded(user).catch((error) =>
        console.error(
          `[Proactive] リマインド失敗 | discord_id: ${user.discord_id}`,
          error,
        ),
      );
    }
  }

  /**
   * 全ユーザーに対してランダムな確率で雑談メッセージを送信する。
   */
  async handleRandomChat(): Promise<void> {
    const users = await this.userService.findAll();

    for (const user of users) {
      if (Math.random() >= this.config.randomChatProbability) continue;

      await this.sendRandomMessage(user).catch((error) =>
        console.error(
          `[Proactive] ランダム会話失敗 | discord_id: ${user.discord_id}`,
          error,
        ),
      );
    }
  }

  /**
   * 締切が 1日以内または 3日以内の課題がある場合にリマインドを送信する。
   */
  private async sendReminderIfNeeded(user: UserRow): Promise<void> {
    const context = await this.contextService.gatherForProactive(user);
    const now = Date.now();

    const hasUrgentTask = context.pendingTasks.some((task) => {
      if (!task.due_at) return false;
      const daysUntilDue =
        (new Date(task.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
      return REMINDER_THRESHOLD_DAYS.some(
        (threshold) => daysUntilDue >= 0 && daysUntilDue <= threshold,
      );
    });

    if (!hasUrgentTask) return;

    const systemAdditions =
      this.contextService.buildSystemPromptAdditions(context);
    const message = await this.chatService.generateMessage(
      systemAdditions,
      "締切が近い課題についてリマインドのメッセージを1件だけ送ってください。",
    );

    await this.discordSenderService.sendDM(user.discord_id, message);
    console.log(`[Proactive] リマインド送信 | discord_id: ${user.discord_id}`);
  }

  /**
   * ユーザーに自発的な雑談メッセージを送信する。
   */
  private async sendRandomMessage(user: UserRow): Promise<void> {
    const context = await this.contextService.gatherForProactive(user);
    const systemAdditions =
      this.contextService.buildSystemPromptAdditions(context);
    const message = await this.chatService.generateMessage(
      systemAdditions,
      "ユーザーへの自発的な短い会話メッセージを1件だけ生成してください。課題状況や記憶を参考にしてもよいですが、完全な雑談でも構いません。",
    );

    await this.discordSenderService.sendDM(user.discord_id, message);
    console.log(
      `[Proactive] ランダム会話送信 | discord_id: ${user.discord_id}`,
    );
  }
}
