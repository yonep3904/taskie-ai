import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import type { ChatService, ContextService } from "@/services/chat";
import type { ConversationService, UserService } from "@/services/db";
import type { DiscordSenderService } from "@/services/discord";

export class MessageHandler {
  constructor(
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly contextService: ContextService,
    private readonly chatService: ChatService,
    private readonly discordSenderService: DiscordSenderService,
  ) {}

  /**
   * Discord の MessageCreate イベントを処理する。
   *
   * ユーザーの自動登録 → コンテキスト収集（抽出・DB更新を含む） →
   * AI 返答の生成 → 会話履歴の保存・送信 を行う。
   */
  async handle(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (message.system) return;

    try {
      const { user, isNew } = await this.userService.findOrCreate({
        discordId: message.author.id,
        discordUsername: message.author.username,
        displayName: message.author.displayName,
        avatarUrl: message.author.displayAvatarURL(),
      });

      if (isNew) {
        console.log(`[Bot] ユーザー登録 | discord_id: ${user.discord_id}`);
        await this.discordSenderService.replyToMessage(
          message,
          WELCOME_MESSAGE,
        );
        return;
      }

      const context = await this.contextService.gatherForReply(
        user,
        message.content,
      );
      const systemAdditions =
        this.contextService.buildSystemPromptAdditions(context);
      const reply = await this.chatService.generateReply(
        context.history,
        message.content,
        systemAdditions,
      );

      await this.conversationService.save({
        userId: user.id,
        role: "user",
        content: message.content,
      });
      await this.conversationService.save({
        userId: user.id,
        role: "assistant",
        content: reply,
      });

      await this.discordSenderService.replyToMessage(message, reply);
      console.log(`[Bot] 返答送信 | ユーザー: ${message.author.tag}`);
    } catch (error) {
      console.error("[Bot] メッセージ処理中にエラーが発生しました:", error);
      await this.discordSenderService
        .replyToMessage(message, AI_UNAVAILABLE_MESSAGE)
        .catch(() => {});
    }
  }
}
