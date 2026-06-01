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
