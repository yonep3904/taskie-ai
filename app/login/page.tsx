import type { Metadata } from "next";
import { LoginCard } from "./_components/login-card";

export const metadata: Metadata = {
  title: "ログイン | Taskie",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 p-6">
      <LoginCard />
    </main>
  );
}
