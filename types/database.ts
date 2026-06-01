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
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          discord_id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          discord_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
