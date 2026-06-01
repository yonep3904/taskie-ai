import { notFound } from "next/navigation";
import { DiscordAuthTest } from "@/app/debug/_components/discord-auth-test";

export default function DebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 p-6">
      <DiscordAuthTest />
    </main>
  );
}
