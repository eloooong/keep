import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getActivity } from "@/app/actions/activity";
import { ActivityList } from "@/components/activity/ActivityList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { LogOut } from "lucide-react";

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activity = await getActivity();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Keep.
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
          <ThemeToggle />
          <Link
            href="/"
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
          <form action={signOut}>
            <IconButton
              icon={<LogOut size={16} />}
              ariaLabel="Log out"
              type="submit"
            />
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Activity log
          </h2>
          {activity.length > 0 ? (
            <ActivityList activity={activity} />
          ) : (
            <div className="rounded-2xl border border-dashed border-black/[.15] p-10 text-center dark:border-white/[.15]">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                No activity yet
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Events will appear here when keys are viewed, copied, edited,
                shared, or revoked.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
