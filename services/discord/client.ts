import { Client, GatewayIntentBits, Partials } from "discord.js";

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

/**
 * Bot 用の Discord クライアントを生成して返す。
 */
export function createDiscordClient(): Client {
  return new Client({
    intents: [...BOT_INTENTS],
    partials: [...BOT_PARTIALS],
  });
}
