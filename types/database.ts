/** users テーブルの行 */
export type UserRow = {
  id: string;
  discord_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

/** users テーブルへの INSERT 型 */
export type UserInsert = Omit<UserRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

/** Supabase クライアントに渡すデータベーススキーマ型 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: Partial<UserInsert>;
      };
    };
  };
};
