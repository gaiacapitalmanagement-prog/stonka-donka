import { auth, signOut } from "@/auth";
import { Dashboard } from "./components/Dashboard";
import { ThemeToggle } from "./components/ThemeToggle";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans transition-colors">
      <header className="border-b border-[var(--border-light)] px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stonka Donka</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">My Stock Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-[var(--text-muted)]">{session?.user?.name}</span>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <button type="submit" className="text-sm text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main>
        <Dashboard userId={session?.user?.email || "default"} />
      </main>
    </div>
  );
}
