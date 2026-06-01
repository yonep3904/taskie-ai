export const Env = {
  meta: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "URL_NOT_SET",
  },
  api: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "URL_NOT_SET",
    supabaseAnonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "ANON_KEY_NOT_SET",
    discordBotToken:
      process.env.DISCORD_BOT_TOKEN || "DISCORD_BOT_TOKEN_NOT_SET",
  },
  env: {
    state: process.env.NODE_ENV,
    development: process.env.NODE_ENV === "development",
    test: process.env.NODE_ENV === "test",
    production: process.env.NODE_ENV === "production",
  },
} as const;
