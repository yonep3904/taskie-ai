import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  buildTaskContext,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import type { ChatService } from "@/services/chat";
import type { ConversationService } from "@/services/conversation";
import type { DiscordSenderService } from "@/services/discord/sender";
import type { ExtractionService } from "@/services/extraction";
import type { TaskService } from "@/services/task";
import type { UserService } from "@/services/user";
import type { TaskRow, UserRow } from "@/types/database";

export class MessageHandler {
  constructor(
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly taskService: TaskService,
    private readonly extractionService: ExtractionService,
    private readonly chatService: ChatService,
    private readonly discordSenderService: DiscordSenderService,
  ) {}

  /**
   * タスク抽出を実行し、DB を更新して登録・完了タスクを返す。
   * 返却値は AI 返答のコンテキストとして使用する。
   */
  private async runTaskExtraction(
    user: UserRow,
    userMessage: string,
  ): Promise<{ registered: TaskRow[]; completed: TaskRow[] }> {
    const result = await this.extractionService.extract(userMessage);
    console.log(
      `[Bot] 抽出結果 | newTasks: ${result.newTasks.length}, completed: ${result.completedTaskTitles.length}`,
    );

    const registered: TaskRow[] = [];
    const completed: TaskRow[] = [];

    // 新規タスクの登録
    for (const extracted of result.newTasks) {
      const task = await this.taskService.create({
        userId: user.id,
        title: extracted.title,
        description: extracted.description ?? null,
        dueAt: extracted.due_at ?? null,
      });
      console.log(`[Bot] タスク登録 | title: ${task.title}`);
      registered.push(task);
    }

    // 完了タスクの更新
    for (const keyword of result.completedTaskTitles) {
      const tasks = await this.taskService.findPendingByTitle(user.id, keyword);
      for (const task of tasks) {
        await this.taskService.complete(task.id);
        console.log(`[Bot] タスク完了 | title: ${task.title}`);
        completed.push(task);
      }
    }

    return { registered, completed };
  }

  /**
   * MessageCreate イベントのハンドラー。
   * `client.on(Events.MessageCreate, (msg) => handler.handle(msg))` で登録する。
   *
   * ユーザーの自動登録 → タスク抽出・DB 更新 → AI 返答の生成（タスク結果を参照） →
   * 会話履歴の保存・送信 を行う。
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

      const history = await this.conversationService.getRecentHistory(user.id);

      // タスク抽出を先に実行し、結果を AI 返答に反映させる
      const { registered, completed } = await this.runTaskExtraction(
        user,
        message.content,
      ).catch((error) => {
        console.error("[Bot] タスク抽出中にエラーが発生しました:", error);
        return { registered: [] as TaskRow[], completed: [] as TaskRow[] };
      });

      const taskContext = buildTaskContext(registered, completed);
      const reply = await this.chatService.generateReply(
        history,
        message.content,
        taskContext,
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
