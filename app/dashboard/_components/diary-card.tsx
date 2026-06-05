"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { RiRobot2Fill } from "react-icons/ri";

type DiaryState =
  | { status: "loading" }
  | { status: "ok"; content: string }
  | { status: "none" }
  | { status: "error" };

/** YYYY-MM-DD 形式で今日の JST 日付を返す */
function getTodayJST(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/** YYYY-MM-DD を日本語表示に変換 */
function formatDateJP(date: string): string {
  return new Date(`${date}T00:00:00+09:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** 指定日を N 日分ずらした日付を返す */
function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  d.setDate(d.getDate() + delta);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(d);
}

/** 日記の日付ナビゲーター付きカード */
export function DiaryCard() {
  const today = getTodayJST();
  const [currentDate, setCurrentDate] = useState(today);
  const [diary, setDiary] = useState<DiaryState>({ status: "loading" });
  // 日記が存在する日付の Set（ナビゲーション用のドット表示に使用）
  const [datesWithDiary, setDatesWithDiary] = useState<Set<string>>(new Set());

  // 日記が存在する日付一覧を取得
  useEffect(() => {
    fetch("/api/diary/dates")
      .then((r) => r.json())
      .then((data: { dates?: string[] }) => {
        if (data.dates) setDatesWithDiary(new Set(data.dates));
      })
      .catch(() => {});
  }, []);

  // 日付が変わるたびに日記を取得
  const fetchDiary = useCallback((date: string) => {
    setDiary({ status: "loading" });
    fetch(`/api/diary?date=${date}`)
      .then((r) => {
        if (r.status === 404) return null;
        return r.json();
      })
      .then((data: { content?: string } | null) => {
        if (data?.content) {
          setDiary({ status: "ok", content: data.content });
          // 新規生成された場合はキャッシュに追加
          setDatesWithDiary((prev) => new Set([...prev, date]));
        } else {
          setDiary({ status: "none" });
        }
      })
      .catch(() => setDiary({ status: "error" }));
  }, []);

  useEffect(() => {
    fetchDiary(currentDate);
  }, [currentDate, fetchDiary]);

  const canGoPrev = currentDate > "2020-01-01";
  const canGoNext = currentDate < today;
  const isToday = currentDate === today;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.08))",
        border: "1px solid rgba(139,92,246,0.3)",
        boxShadow: "0 8px 32px rgba(139,92,246,0.15)",
      }}
    >
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}
        >
          <RiRobot2Fill className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Taskie の日記</h3>

        {diary.status === "loading" && (
          <div className="ml-auto flex items-center gap-1">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.span
                key={delay}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#a855f7" }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 日付ナビゲーター */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          disabled={!canGoPrev}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 disabled:opacity-25"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="前の日"
        >
          <HiChevronLeft className="h-4 w-4 text-slate-300" />
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold text-slate-200">
            {formatDateJP(currentDate)}
          </p>
          {isToday && (
            <span
              className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: "rgba(168,85,247,0.2)",
                color: "#c084fc",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              今日
            </span>
          )}
          {/* 日記あり/なしのドット */}
          <div className="mt-1.5 flex justify-center gap-1">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const d = addDays(currentDate, offset);
              const hasDiary = datesWithDiary.has(d);
              const isCurrent = offset === 0;
              return (
                <button
                  key={offset}
                  type="button"
                  onClick={() => d <= today && setCurrentDate(d)}
                  disabled={d > today}
                  className="h-1.5 rounded-full transition-all duration-150 disabled:opacity-30"
                  style={{
                    width: isCurrent ? "16px" : "6px",
                    background: isCurrent
                      ? "#a855f7"
                      : hasDiary
                        ? "rgba(168,85,247,0.5)"
                        : "rgba(255,255,255,0.12)",
                  }}
                  aria-label={`${d}の日記`}
                />
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          disabled={!canGoNext}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 disabled:opacity-25"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-label="次の日"
        >
          <HiChevronRight className="h-4 w-4 text-slate-300" />
        </button>
      </div>

      {/* 日記本文 */}
      <AnimatePresence mode="wait">
        {diary.status === "loading" && (
          <motion.div
            key={`loading-${currentDate}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DiarySkeletonLines />
          </motion.div>
        )}
        {diary.status === "ok" && (
          <motion.p
            key={`ok-${currentDate}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300"
          >
            {diary.content}
          </motion.p>
        )}
        {diary.status === "none" && (
          <motion.p
            key={`none-${currentDate}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-600"
          >
            この日の日記はありません
          </motion.p>
        )}
        {diary.status === "error" && (
          <motion.p
            key={`error-${currentDate}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-600"
          >
            日記を取得できませんでした
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const SKELETON_WIDTHS = ["92%", "78%", "85%", "60%"] as const;

function DiarySkeletonLines() {
  return (
    <div className="space-y-2">
      {SKELETON_WIDTHS.map((width) => (
        <div
          key={width}
          className="h-3 rounded-full"
          style={{
            width,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}
