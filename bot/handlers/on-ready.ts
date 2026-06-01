import type { Client } from "discord.js";

/**
 * Bot の起動完了時に呼ばれるハンドラー。
 * `client.once(Events.ClientReady, onReady)` で登録する。
 */
export function onReady(client: Client<true>): void {
  console.log(`[Bot] ${client.user.tag} として起動しました`);
}
