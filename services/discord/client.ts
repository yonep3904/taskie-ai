import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Env } from "@/lib/env";

/**
 * 必要な Gateway Intents。
 * MessageContent と GuildMembers は特権インテントのため、
 * Discord Developer Portal で有効化が必要。
 */
const BOT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent, // 特権インテント: メッセージ本文の読み取り
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildMembers, // 特権インテント: メンバー情報の取得
] as const;

/**
 * Partials: DM チャンネルはキャッシュされないため Channel と Message が必要。
 */
const BOT_PARTIALS = [Partials.Channel, Partials.Message] as const;

let _client: Client | null = null;

/**
 * Discord クライアントのシングルトンを返す。
 * 初回呼び出し時にインスタンスを生成する。
 */
export function getDiscordClient(): Client {
  if (!_client) {
    _client = new Client({
      intents: [...BOT_INTENTS],
      partials: [...BOT_PARTIALS],
    });
  }
  return _client;
}

/**
 * Bot トークンを使って Discord にログインする。
 */
export async function loginDiscordClient(): Promise<void> {
  const client = getDiscordClient();
  await client.login(Env.api.discordBotToken);
}
