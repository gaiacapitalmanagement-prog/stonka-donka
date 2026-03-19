import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex items-center justify-center">
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-8 w-full max-w-sm text-center space-y-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stonka Donka</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Sign in to access your dashboard
          </p>
        </div>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="w-full bg-[var(--text-primary)] text-[var(--bg-page)] font-medium py-2.5 px-4 rounded-lg hover:bg-[var(--btn-hover)] transition-colors cursor-pointer"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
