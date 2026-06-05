"use client";

import { motion } from "motion/react";
import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiTrophy,
  HiXCircle,
} from "react-icons/hi2";
import { Progress } from "@/components/ui/progress";
import type { TaskRow } from "@/types/database";

type Props = {
  tasks: TaskRow[];
};

/** ダッシュボード上部の統計カードエリア */
export function TodaySummary({ tasks }: Props) {
  const now = Date.now();

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => t.status === "overdue").length;
  const urgentCount = tasks.filter((t) => {
    if (!t.due_at) return false;
    const days = (new Date(t.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  }).length;

  const totalCount = tasks.length;
  const completionPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const stats = [
    {
      label: "未完了",
      value: pendingCount,
      icon: HiCheckCircle,
      gradientFrom: "rgba(99,102,241,0.25)",
      gradientTo: "rgba(59,130,246,0.15)",
      border: "rgba(99,102,241,0.35)",
      glow: "rgba(99,102,241,0.2)",
      barGradient: "linear-gradient(90deg, #6366f1, #3b82f6)",
      textColor: "#a5b4fc",
      iconColor: "#818cf8",
      alwaysHighlight: false,
      isAlert: false,
    },
    {
      label: "締切3日以内",
      value: urgentCount,
      icon: HiExclamationTriangle,
      gradientFrom:
        urgentCount > 0 ? "rgba(245,158,11,0.25)" : "rgba(71,85,105,0.15)",
      gradientTo:
        urgentCount > 0 ? "rgba(249,115,22,0.15)" : "rgba(71,85,105,0.08)",
      border:
        urgentCount > 0 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.06)",
      glow: urgentCount > 0 ? "rgba(245,158,11,0.2)" : "transparent",
      barGradient:
        urgentCount > 0
          ? "linear-gradient(90deg, #f59e0b, #f97316)"
          : "linear-gradient(90deg, #475569, #475569)",
      textColor: urgentCount > 0 ? "#fcd34d" : "#64748b",
      iconColor: urgentCount > 0 ? "#fbbf24" : "#475569",
      alwaysHighlight: false,
      isAlert: urgentCount > 0,
    },
    {
      label: "期限超過",
      value: overdueCount,
      icon: HiXCircle,
      gradientFrom:
        overdueCount > 0 ? "rgba(244,63,94,0.25)" : "rgba(71,85,105,0.15)",
      gradientTo:
        overdueCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(71,85,105,0.08)",
      border:
        overdueCount > 0 ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.06)",
      glow: overdueCount > 0 ? "rgba(244,63,94,0.2)" : "transparent",
      barGradient:
        overdueCount > 0
          ? "linear-gradient(90deg, #f43f5e, #ef4444)"
          : "linear-gradient(90deg, #475569, #475569)",
      textColor: overdueCount > 0 ? "#fca5a5" : "#64748b",
      iconColor: overdueCount > 0 ? "#f87171" : "#475569",
      alwaysHighlight: false,
      isAlert: overdueCount > 0,
    },
  ];

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        今日の状況
      </p>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
            style={{
              background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo})`,
              border: `1px solid ${stat.border}`,
              boxShadow: `0 8px 32px ${stat.glow}, 0 0 0 0 transparent`,
            }}
          >
            {/* アラート状態の場合は外枠をパルス */}
            {stat.isAlert && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ border: `1px solid ${stat.border}` }}
              />
            )}

            <div className="flex items-start justify-between">
              <p
                className="text-xs font-medium leading-tight"
                style={{ color: stat.textColor }}
              >
                {stat.label}
              </p>
              <stat.icon
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: stat.iconColor }}
              />
            </div>

            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: i * 0.08 + 0.2,
                duration: 0.35,
                type: "spring",
                stiffness: 200,
              }}
              className="mt-2 text-4xl font-bold tabular-nums"
              style={{ color: stat.textColor }}
            >
              {stat.value}
            </motion.p>

            {/* カラーバー */}
            <div
              className="mt-3 h-0.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }}
                style={{ background: stat.barGradient }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 完了進捗バー */}
      {totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-4 rounded-xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HiTrophy className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs text-slate-400">完了進捗</span>
            </div>
            <span className="text-xs font-semibold text-indigo-300">
              {completedCount} / {totalCount} 件 ({completionPct}%)
            </span>
          </div>
          <Progress value={completionPct} className="h-1.5" />
        </motion.div>
      )}
    </section>
  );
}
