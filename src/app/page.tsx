import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { KeysList } from "@/components/keys/KeysList";
import { ExpiryBanner } from "@/components/keys/ExpiryBanner";
import { AppShell } from "@/components/AppShell";
import { expiryStatus } from "@/utils/expiry";
import { connection } from "next/server";
import { VaultHeader } from "@/components/keys/VaultHeader";

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase
    .from("keys")
    .select(
      "id, name, notes, category, tags, expires_at, user_id, last_viewed_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const keys = data ?? [];
  const { data: shares, error: sharesError } = await supabase
    .from("key_shares")
    .select("key_id, permission")
    .eq("user_id", user.id);
  if (sharesError) throw new Error("Unable to load key permissions");
  const permissions = new Map(
    (shares ?? []).map((share) => [share.key_id, share.permission]),
  );
  const keyItems = keys.map((key) => ({
    ...key,
    canEdit: key.user_id === user.id || permissions.get(key.id) === "edit",
  }));
  const { data: dismissed } = await supabase
    .from("key_dismissals")
    .select("key_id")
    .eq("user_id", user.id);
  const dismissedIds = new Set((dismissed ?? []).map((row) => row.key_id));
  const attention = keys.filter((key) =>
    ["expired", "soon"].includes(expiryStatus(key.expires_at)),
  ).length;
  return (
    <AppShell email={user.email ?? "Your account"}>
      <VaultHeader
        total={keys.length}
        categories={
          new Set(keys.map((key) => key.category).filter(Boolean)).size
        }
        attention={attention}
      />
      <ExpiryBanner keys={keys.filter((key) => !dismissedIds.has(key.id))} />
      <KeysList keys={keyItems} currentUserId={user.id} />
    </AppShell>
  );
}
