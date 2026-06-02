import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TaskRow } from "@/types/database";

type CreateTaskParams = {
  userId: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
};

export class TaskService {
  constructor(private readonly supabaseClient: SupabaseClient<Database>) {}

  /**
   * 新しいタスクを作成する。
   */
  async create(params: CreateTaskParams): Promise<TaskRow> {
    const { data, error } = await this.supabaseClient
      .from("tasks")
      .insert({
        user_id: params.userId,
        title: params.title,
        description: params.description ?? null,
        due_at: params.dueAt ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error("タスクの作成に失敗しました");
    }

    return data;
  }

  /**
   * タイトルの部分一致でユーザーの pending タスクを検索する。
   */
  async findPendingByTitle(
    userId: string,
    titleKeyword: string,
  ): Promise<TaskRow[]> {
    const { data, error } = await this.supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .ilike("title", `%${titleKeyword}%`);

    if (error) throw error;

    return data ?? [];
  }

  /**
   * タスクを完了状態に更新する。
   */
  async complete(taskId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) throw error;
  }
}
