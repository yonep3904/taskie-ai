import type { Attachment, Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  UNSUPPORTED_FILE_MESSAGE,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import type { ChatService, ContextService, FileService } from "@/services/chat";
import type { ConversationService, UserService } from "@/services/db";
import type { DiscordSenderService } from "@/services/discord";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export class MessageHandler {
  constructor(
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly contextService: ContextService,
    private readonly chatService: ChatService,
    private readonly fileService: FileService,
    private readonly discordSenderService: DiscordSenderService,
  ) {}

  /**
   * Discord の MessageCreate イベントを処理する。
   *
   * ユーザーの自動登録 → コンテキスト収集 → AI 返答生成 → 保存・送信 を行う。
   * 添付ファイルがある場合はファイル解説モードで応答する。
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

      const attachments = [...message.attachments.values()];
      if (attachments.length > 0) {
        await this.handleWithFiles(message, user, attachments);
      } else {
        await this.handleText(message, user);
      }
    } catch (error) {
      console.error("[Bot] メッセージ処理中にエラーが発生しました:", error);
      await this.discordSenderService
        .replyToMessage(message, AI_UNAVAILABLE_MESSAGE)
        .catch(() => {});
    }
  }

  /** テキストのみのメッセージを処理する */
  private async handleText(message: Message, user: UserRow): Promise<void> {
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

    await this.saveConversation(user.id, message.content, reply);
    await this.discordSenderService.replyToMessage(message, reply);
    console.log(`[Bot] 返答送信 | ユーザー: ${message.author.tag}`);
  }

  /** 添付ファイル付きメッセージを処理する */
  private async handleWithFiles(
    message: Message,
    user: UserRow,
    rawAttachments: Attachment[],
  ): Promise<void> {
    const processed = await this.fileService.processAll(rawAttachments);

    if (processed.length === 0) {
      await this.discordSenderService.replyToMessage(
        message,
        UNSUPPORTED_FILE_MESSAGE,
      );
      return;
    }

    const context = await this.contextService.gatherForProactive(user);
    const systemAdditions =
      this.contextService.buildSystemPromptAdditions(context);
    const reply = await this.chatService.generateExplanation(
      message.content,
      processed,
      systemAdditions,
    );

    // ファイル付きメッセージのユーザーターンはファイル名を含める
    const filenames = processed.map((p) => p.filename).join(", ");
    const userContent = message.content
      ? `${message.content} [添付: ${filenames}]`
      : `[添付ファイル: ${filenames}]`;

    await this.saveConversation(user.id, userContent, reply);
    await this.discordSenderService.replyToMessage(message, reply);
    console.log(
      `[Bot] ファイル解説送信 | ユーザー: ${message.author.tag} | ファイル: ${filenames}`,
    );
  }

  private async saveConversation(
    userId: string,
    userContent: string,
    assistantContent: string,
  ): Promise<void> {
    await this.conversationService.save({
      userId,
      role: "user",
      content: userContent,
    });
    await this.conversationService.save({
      userId,
      role: "assistant",
      content: assistantContent,
    });
  }
}
