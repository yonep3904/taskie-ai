"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi2";
import { RiRobot2Fill } from "react-icons/ri";

type DiaryState =
  | { status: "loading" }
  | { status: "ok"; content: string }
  | { status: "error" };

type CommentState =
  | { status: "loading" }
  | { status: "ok"; comment: string }
  | { status: "error" };

/** AI コメントと AI 日記を並行フェッチして表示するクライアントコンポーネント */
export function AIContent() {
  const [diary, setDiary] = useState<DiaryState>({ status: "loading" });
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

    fetch("/api/diary")
      .then((r) => r.json())
      .then((data: { content?: string }) => {
        if (data.content) {
          setDiary({ status: "ok", content: data.content });
        } else {
          setDiary({ status: "error" });
        }
      })
      .catch(() => setDiary({ status: "error" }));
  }, []);

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        AI からのメッセージ
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* AIコメント */}
        <AICard
          title="Taskie のコメント"
          icon={HiSparkles}
          accentColor="#6366f1"
          gradientFrom="rgba(99,102,241,0.18)"
          gradientTo="rgba(139,92,246,0.10)"
          borderColor="rgba(99,102,241,0.3)"
          glowColor="rgba(99,102,241,0.15)"
          isLoading={comment.status === "loading"}
        >
          <AnimatePresence mode="wait">
            {comment.status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PulsingDots color="#6366f1" />
                <SkeletonLines count={2} />
              </motion.div>
            )}
            {comment.status === "ok" && (
              <motion.p
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm leading-relaxed text-slate-300"
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
        </AICard>

        {/* AI日記 */}
        <AICard
          title="Taskie の日記"
          icon={RiRobot2Fill}
          accentColor="#a855f7"
          gradientFrom="rgba(139,92,246,0.18)"
          gradientTo="rgba(236,72,153,0.08)"
          borderColor="rgba(139,92,246,0.3)"
          glowColor="rgba(139,92,246,0.15)"
          isLoading={diary.status === "loading"}
        >
          <AnimatePresence mode="wait">
            {diary.status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PulsingDots color="#a855f7" />
                <SkeletonLines count={3} />
              </motion.div>
            )}
            {diary.status === "ok" && (
              <motion.p
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300"
              >
                {diary.content}
              </motion.p>
            )}
            {diary.status === "error" && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-600"
              >
                日記を取得できませんでした
              </motion.p>
            )}
          </AnimatePresence>
        </AICard>
      </div>
    </section>
  );
}

type AICardProps = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowColor: string;
  isLoading: boolean;
  children: React.ReactNode;
};

/** AIセクション共通カード */
function AICard({
  title,
  icon: Icon,
  accentColor,
  gradientFrom,
  gradientTo,
  borderColor,
  glowColor,
  isLoading,
  children,
}: AICardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px ${glowColor}`,
      }}
    >
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${accentColor}25`, color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>

        {/* ローディング中は点滅ドット */}
        {isLoading && (
          <div className="ml-auto flex items-center gap-1">
            {DOT_DELAYS.map((delay) => (
              <motion.span
                key={delay}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: accentColor }}
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

      {children}
    </div>
  );
}

const SKELETON_WIDTHS = ["85%", "70%", "55%", "80%", "65%"] as const;
const DOT_DELAYS = [0, 0.15, 0.3] as const;

/** ローディング時のスケルトンライン */
function SkeletonLines({ count }: { count: number }) {
  return (
    <div className="mt-3 space-y-2">
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

/** ローディング時のパルスドット */
function PulsingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1">
      {DOT_DELAYS.map((delay) => (
        <motion.span
          key={delay}
          className="h-1 w-1 rounded-full"
          style={{ background: color, opacity: 0.4 }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
