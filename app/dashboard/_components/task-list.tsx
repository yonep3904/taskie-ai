import {
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiListBullet,
} from "react-icons/hi2";
import type { TaskRow } from "@/types/database";

type Props = {
  tasks: TaskRow[];
};

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  badgeStyle: React.CSSProperties;
  borderColor: string;
  iconStyle: React.CSSProperties;
};

const STATUS_CONFIG: Record<TaskRow["status"], StatusConfig> = {
  pending: {
    label: "未完了",
    icon: HiClock,
    badgeStyle: {
      background: "rgba(99,102,241,0.15)",
      color: "#a5b4fc",
      border: "1px solid rgba(99,102,241,0.3)",
    },
    borderColor: "rgba(99,102,241,0.5)",
    iconStyle: { color: "#818cf8" },
  },
  completed: {
    label: "完了",
    icon: HiCheckCircle,
    badgeStyle: {
      background: "rgba(16,185,129,0.15)",
      color: "#6ee7b7",
      border: "1px solid rgba(16,185,129,0.3)",
    },
    borderColor: "rgba(16,185,129,0.5)",
    iconStyle: { color: "#34d399" },
  },
  overdue: {
    label: "期限超過",
    icon: HiExclamationCircle,
    badgeStyle: {
      background: "rgba(244,63,94,0.15)",
      color: "#fca5a5",
      border: "1px solid rgba(244,63,94,0.3)",
    },
    borderColor: "rgba(244,63,94,0.5)",
    iconStyle: { color: "#f87171" },
  },
};

/** 期限までの残日数を算出してラベルを返す */
function dueDaysLabel(dueAt: string, status: TaskRow["status"]): string | null {
  if (status === "completed") return null;
  const daysLeft = Math.ceil(
    (new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (status === "overdue") return `${Math.abs(daysLeft)}日超過`;
  if (daysLeft === 0) return "今日";
  if (daysLeft === 1) return "明日";
  return `あと${daysLeft}日`;
}

/** 残日数ラベルのスタイルを返す */
function dueDaysStyle(
  dueAt: string,
  status: TaskRow["status"],
): React.CSSProperties {
  if (status === "overdue") return { color: "#f87171" };
  const days = Math.ceil(
    (new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 1) return { color: "#f87171" };
  if (days <= 3) return { color: "#fbbf24" };
  return { color: "#64748b" };
}

/** 課題一覧カード */
export function TaskList({ tasks }: Props) {
  const sorted = [...tasks].sort((a, b) => {
    // overdue → pending（期限近い順）→ completed
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    if (a.due_at && b.due_at)
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    if (a.due_at) return -1;
    if (b.due_at) return 1;
    return 0;
  });

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          課題一覧
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-slate-400"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {sorted.length} 件
        </span>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-600">
            <HiListBullet className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">課題はありません</p>
          </div>
        ) : (
          <ul>
            {sorted.map((task, i) => {
              const config = STATUS_CONFIG[task.status];
              const StatusIcon = config.icon;
              const daysLabel = task.due_at
                ? dueDaysLabel(task.due_at, task.status)
                : null;
              const daysStyle = task.due_at
                ? dueDaysStyle(task.due_at, task.status)
                : {};

              return (
                <li
                  key={task.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-white/[0.03]"
                  style={{
                    borderLeft: `3px solid ${config.borderColor}`,
                    borderBottom:
                      i < sorted.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  <StatusIcon
                    className="h-5 w-5 flex-shrink-0"
                    style={config.iconStyle}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        task.status === "completed"
                          ? "text-slate-500 dark:text-slate-500 line-through"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.due_at && (
                      <p className="mt-0.5 text-xs text-slate-600">
                        {new Date(task.due_at).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        {daysLabel && (
                          <span
                            className="ml-2 font-semibold"
                            style={daysStyle}
                          >
                            {daysLabel}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={config.badgeStyle}
                  >
                    {config.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
