import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActivity } from "@/app/actions/activity";
import { ActivityList } from "@/components/activity/ActivityList";
import { AppShell } from "@/components/AppShell";
import { connection } from "next/server";
export default async function ActivityPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const activity = await getActivity();
  return (
    <AppShell email={user.email ?? "Your account"}>
      <div className="page-heading">
        <div>
          <h1>Activity</h1>
          <p className="page-description">
            See who created, viewed, copied, changed, or deleted your keys.
          </p>
        </div>
      </div>
      <ActivityList activity={activity} />
    </AppShell>
  );
}
