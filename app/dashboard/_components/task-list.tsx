import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskRow } from "@/types/database";

type Props = {
  tasks: TaskRow[];
};

const STATUS_LABELS: Record<TaskRow["status"], string> = {
  pending: "未完了",
  completed: "完了",
  overdue: "期限超過",
};

const STATUS_VARIANTS: Record<
  TaskRow["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  completed: "default",
  overdue: "destructive",
};

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">課題一覧</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            課題はありません
          </p>
        ) : (
          <ul className="divide-y">
            {sorted.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-3">
                <Badge variant={STATUS_VARIANTS[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {task.title}
                  </p>
                  {task.due_at && (
                    <p className="text-xs text-zinc-500">
                      期限:{" "}
                      {new Date(task.due_at).toLocaleDateString("ja-JP", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
