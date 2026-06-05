import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskRow } from "@/types/database";

type Props = {
  tasks: TaskRow[];
};

export function TodaySummary({ tasks }: Props) {
  const now = Date.now();

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const urgentCount = tasks.filter((t) => {
    if (!t.due_at) return false;
    const days = (new Date(t.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  }).length;
  const overdueCount = tasks.filter((t) => t.status === "overdue").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">今日の状況</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <StatItem label="未完了" value={pendingCount} unit="件" />
          <StatItem
            label="締切3日以内"
            value={urgentCount}
            unit="件"
            highlight={urgentCount > 0}
          />
          <StatItem
            label="期限超過"
            value={overdueCount}
            unit="件"
            highlight={overdueCount > 0}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={`text-2xl font-bold ${highlight ? "text-red-500" : "text-zinc-900"}`}
      >
        {value}
        <span className="text-sm font-normal text-zinc-500 ml-0.5">{unit}</span>
      </dd>
    </div>
  );
}
