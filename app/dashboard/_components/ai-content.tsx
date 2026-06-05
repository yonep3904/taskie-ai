"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taskie のコメント</CardTitle>
        </CardHeader>
        <CardContent>
          {comment.status === "loading" && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {comment.status === "ok" && (
            <p className="text-sm text-zinc-700 leading-relaxed">
              {comment.comment}
            </p>
          )}
          {comment.status === "error" && (
            <p className="text-sm text-zinc-400">
              コメントを取得できませんでした
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taskie の日記</CardTitle>
        </CardHeader>
        <CardContent>
          {diary.status === "loading" && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          )}
          {diary.status === "ok" && (
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {diary.content}
            </p>
          )}
          {diary.status === "error" && (
            <p className="text-sm text-zinc-400">日記を取得できませんでした</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
