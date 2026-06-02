/**
 * Supabase の型生成ツール (supabase gen types) と同じ形式で定義する。
 * テーブルを追加するたびにここに追記する。
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_id: string;
          display_name: string;
          discord_username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discord_id: string;
          display_name: string;
          discord_username: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          display_name?: string;
          discord_username?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_at: string | null;
          status: "pending" | "completed" | "overdue";
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_at?: string | null;
          status?: "pending" | "completed" | "overdue";
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_at?: string | null;
          status?: "pending" | "completed" | "overdue";
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          importance: "high" | "medium" | "low";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          importance?: "high" | "medium" | "low";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          importance?: "high" | "medium" | "low";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/** users テーブルの行型 */
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

/** users テーブルの INSERT 型 */
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

/** conversations テーブルの行型 */
export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];

/** tasks テーブルの行型 */
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

/** memories テーブルの行型 */
export type MemoryRow = Database["public"]["Tables"]["memories"]["Row"];

/** memories テーブルの importance 型 */
export type MemoryImportance = MemoryRow["importance"];
