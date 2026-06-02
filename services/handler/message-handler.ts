import type { Message } from "discord.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  WELCOME_MESSAGE,
} from "@/constants/bot-messages";
import type { ChatService, ExtractionService } from "@/services/chat";
import type {
  ConversationService,
  MemoryService,
  TaskService,
  UserService,
} from "@/services/db";
import type { DiscordSenderService } from "@/services/discord";
import type { TaskRow, UserRow } from "@/types/database";

export class MessageHandler {
  constructor(
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly taskService: TaskService,
    private readonly memoryService: MemoryService,
    private readonly extractionService: ExtractionService,
    private readonly chatService: ChatService,
    private readonly discordSenderService: DiscordSenderService,
  ) {}

  /**
   * メッセージを解析して DB を更新する。
   * - 新規タスクを登録し、完了タスクを更新する
   * - 長期記憶を保存する
   * タスク操作の結果は AI 返答のコンテキストとして使用する。
   */
  private async runExtraction(
    user: UserRow,
    userMessage: string,
  ): Promise<{ registered: TaskRow[]; completed: TaskRow[] }> {
    const result = await this.extractionService.extract(userMessage);
    console.log(
      `[Bot] 抽出結果 | newTasks: ${result.newTasks.length}, completed: ${result.completedTaskTitles.length}, memories: ${result.memories.length}`,
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

    // 長期記憶の保存
    for (const memory of result.memories) {
      await this.memoryService.save(user.id, memory.content, memory.importance);
      console.log(
        `[Bot] 記憶保存 | importance: ${memory.importance} | ${memory.content}`,
      );
    }

    return { registered, completed };
  }

  /**
   * Discord の MessageCreate イベントを処理する。
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

      // 記憶取得と抽出処理を並列実行
      const [history, memories, { registered, completed }] = await Promise.all([
        this.conversationService.getRecentHistory(user.id),
        this.memoryService.findAll(user.id),
        this.runExtraction(user, message.content).catch((error) => {
          console.error("[Bot] 抽出処理中にエラーが発生しました:", error);
          return { registered: [] as TaskRow[], completed: [] as TaskRow[] };
        }),
      ]);

      const taskContext = this.chatService.buildTaskContext(
        registered,
        completed,
      );
      const reply = await this.chatService.generateReply(
        history,
        message.content,
        memories,
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
