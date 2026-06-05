import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { DiaryService } from "@/services/db";

/**
 * ユーザーの日記が存在する日付一覧を降順で返す。
 *
 * GET /api/diary/dates
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const diaryService = new DiaryService(adminSupabase);
  const dates = await diaryService.listDates(user.id);

  return NextResponse.json({ dates });
}
