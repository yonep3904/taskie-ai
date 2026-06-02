import cron from "node-cron";
import type { ProactiveHandler } from "@/services/handler";

/**
 * 自発メッセージ用のスケジューラーを起動する。
 *
 * スケジュール:
 * - リマインド: 毎日 9:00（JST）にチェック
 * - ランダム会話: 2時間ごとに確率判定（1日 2〜5回程度）
 */
export function startScheduler(proactiveHandler: ProactiveHandler): void {
  // 毎日 9:00 JST にリマインドチェック
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("[Scheduler] リマインドチェック開始");
      await proactiveHandler
        .handleReminders()
        .catch((error) =>
          console.error("[Scheduler] リマインドチェック失敗:", error),
        );
    },
    { timezone: "Asia/Tokyo" },
  );

  // 2時間ごとにランダム会話の確率判定（0・2・4・...・22時）
  cron.schedule(
    "0 */2 * * *",
    async () => {
      await proactiveHandler
        .handleRandomChat()
        .catch((error) =>
          console.error("[Scheduler] ランダム会話失敗:", error),
        );
    },
    { timezone: "Asia/Tokyo" },
  );

  console.log(
    "[Scheduler] スケジューラー起動（リマインド: 毎日9時 / ランダム会話: 2時間ごと）",
  );
}
