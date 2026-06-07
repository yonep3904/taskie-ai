"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi2";
import { DiaryCard } from "./diary-card";

type CommentState =
  | { status: "loading" }
  | { status: "ok"; comment: string }
  | { status: "error" };

/** AI コメントと AI 日記を表示するセクション */
export function AIContent() {
  const [comment, setComment] = useState<CommentState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/ai-comment")
      .then((r) => r.json())
      .then((data: { comment?: string }) => {
        if (data.comment) {
          setComment({ status: "ok", comment: data.comment });
        } else {
          setComment({ status: "error" });
        }
      })
      .catch(() => setComment({ status: "error" }));
  }, []);

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        AI からのメッセージ
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* AIコメントカード */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))",
            border: "1px solid rgba(99,102,241,0.3)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.15)",
          }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "rgba(99,102,241,0.25)", color: "#6366f1" }}
            >
              <HiSparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              Taskie のコメント
            </h3>
            {comment.status === "loading" && (
              <div className="ml-auto flex items-center gap-1">
                {DOT_DELAYS.map((delay) => (
                  <motion.span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "#6366f1" }}
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
          <AnimatePresence mode="wait">
            {comment.status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonLines count={2} />
              </motion.div>
            )}
            {comment.status === "ok" && (
              <motion.p
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm leading-relaxed text-slate-900 dark:text-slate-200"
              >
                {comment.comment}
              </motion.p>
            )}
            {comment.status === "error" && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-600"
              >
                コメントを取得できませんでした
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 日記カード（日付ナビゲーター付き） */}
        <DiaryCard />
      </div>
    </section>
  );
}

const SKELETON_WIDTHS = ["85%", "70%", "55%"] as const;
const DOT_DELAYS = [0, 0.15, 0.3] as const;

function SkeletonLines({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {SKELETON_WIDTHS.slice(0, count).map((width) => (
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
