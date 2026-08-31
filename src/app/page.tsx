import { signOut } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          API Key Saver
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-dashed border-black/[.15] p-10 text-center dark:border-white/[.15]">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            No API keys yet
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add your first key.
          </p>
        </div>
      </main>
    </div>
  );
}
