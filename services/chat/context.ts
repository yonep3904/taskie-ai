import type { ExtractionService } from "@/services/chat";
import type {
  ConversationService,
  MemoryService,
  TaskService,
} from "@/services/db";
import type {
  ConversationRow,
  MemoryRow,
  TaskRow,
  UserRow,
} from "@/types/database";

/**
 * 返答生成時のコンテキスト。
 * ユーザーメッセージから抽出・DB取得した全情報を保持する。
 */
export type ReplyContext = {
  type: "reply";
  history: ConversationRow[];
  memories: MemoryRow[];
  registered: TaskRow[];
  completed: TaskRow[];
};

/**
 * 自発メッセージ生成時のコンテキスト。
 * ユーザーの現在状態（未完了課題・記憶）を保持する。
 */
export type ProactiveContext = {
  type: "proactive";
  memories: MemoryRow[];
  pendingTasks: TaskRow[];
};

/** すべてのコンテキスト型の共用体 */
export type BotContext = ReplyContext | ProactiveContext;

/**
 * AI が返答・自発メッセージを生成するために必要な情報を収集し、
 * システムプロンプトへの追加テキストを構築するサービス。
 *
 * - 返答モード: 会話履歴・記憶の取得、メッセージからの抽出・DB更新を並列実行
 * - 自発モード: 記憶・未完了課題の取得のみ（抽出なし）
 */
export class ContextService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly taskService: TaskService,
    private readonly memoryService: MemoryService,
    private readonly extractionService: ExtractionService,
  ) {}

  /**
   * 返答生成に必要なコンテキストを収集する。
   * 会話履歴・記憶の取得と、メッセージからの抽出・DB更新を並列で実行する。
   */
  async gatherForReply(
    user: UserRow,
    userMessage: string,
  ): Promise<ReplyContext> {
    const [history, memories, { registered, completed }] = await Promise.all([
      this.conversationService.getRecentHistory(user.id),
      this.memoryService.findAll(user.id),
      this.runExtraction(user, userMessage).catch((error) => {
        console.error("[Context] 抽出処理中にエラーが発生しました:", error);
        return { registered: [] as TaskRow[], completed: [] as TaskRow[] };
      }),
    ]);

    return { type: "reply", history, memories, registered, completed };
  }

  /**
   * 自発メッセージ生成に必要なコンテキストを収集する。
   * 記憶と未完了課題を並列で取得する。
   */
  async gatherForProactive(user: UserRow): Promise<ProactiveContext> {
    const [memories, pendingTasks] = await Promise.all([
      this.memoryService.findAll(user.id),
      this.taskService.findPending(user.id),
    ]);

    return { type: "proactive", memories, pendingTasks };
  }

  /**
   * コンテキストの内容をシステムプロンプトへの追加テキストとして返す。
   * 追加情報がない場合は空文字を返す。
   */
  buildSystemPromptAdditions(context: BotContext): string {
    const sections: string[] = [];

    if (context.memories.length > 0) {
      const lines = context.memories.map((m) => `- ${m.content}`).join("\n");
      sections.push(`## ユーザーについて覚えていること\n${lines}`);
    }

    if (context.type === "reply") {
      const taskContext = this.buildTaskContext(
        context.registered,
        context.completed,
      );
      if (taskContext) {
        sections.push(`## 今回のタスク操作\n${taskContext}`);
      }
    }

    if (context.type === "proactive" && context.pendingTasks.length > 0) {
      const lines = context.pendingTasks
        .map((t) => {
          const due = t.due_at
            ? `締切: ${new Date(t.due_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}`
            : "締切未設定";
          return `- 「${t.title}」（${due}）`;
        })
        .join("\n");
      sections.push(`## ユーザーの未完了課題\n${lines}`);
    }

    return sections.length > 0 ? `\n\n${sections.join("\n\n")}` : "";
  }

  /**
   * メッセージからタスクと記憶を抽出し、DB を更新する。
   */
  private async runExtraction(
    user: UserRow,
    userMessage: string,
  ): Promise<{ registered: TaskRow[]; completed: TaskRow[] }> {
    const result = await this.extractionService.extract(userMessage);
    console.log(
      `[Context] 抽出結果 | newTasks: ${result.newTasks.length}, completed: ${result.completedTaskTitles.length}, memories: ${result.memories.length}`,
    );

    const registered: TaskRow[] = [];
    const completed: TaskRow[] = [];

    for (const extracted of result.newTasks) {
      const task = await this.taskService.create({
        userId: user.id,
        title: extracted.title,
        description: extracted.description ?? null,
        dueAt: extracted.due_at ?? null,
      });
      console.log(`[Context] タスク登録 | title: ${task.title}`);
      registered.push(task);
    }

    for (const keyword of result.completedTaskTitles) {
      const tasks = await this.taskService.findPendingByTitle(user.id, keyword);
      for (const task of tasks) {
        await this.taskService.complete(task.id);
        console.log(`[Context] タスク完了 | title: ${task.title}`);
        completed.push(task);
      }
    }

    for (const memory of result.memories) {
      await this.memoryService.save(user.id, memory.content, memory.importance);
      console.log(
        `[Context] 記憶保存 | importance: ${memory.importance} | ${memory.content}`,
      );
    }

    return { registered, completed };
  }

  /** タスク操作の結果をテキスト化する。操作なしの場合は null */
  private buildTaskContext(
    registered: TaskRow[],
    completed: TaskRow[],
  ): string | null {
    if (registered.length === 0 && completed.length === 0) return null;

    const lines: string[] = [];

    for (const task of registered) {
      const due = task.due_at
        ? `締切: ${new Date(task.due_at).toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "締切未設定";
      lines.push(`新規登録: 「${task.title}」（${due}）`);
    }

    for (const task of completed) {
      lines.push(`完了: 「${task.title}」`);
    }

    return lines.join("\n");
  }
}
