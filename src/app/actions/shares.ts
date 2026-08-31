"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ShareListItem = {
  id: string;
  permission: string;
  created_at: string;
  email: string;
};

async function assertKeyOwner(supabase: Awaited<ReturnType<typeof createClient>>, keyId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: rows, error } = await supabase
    .from("keys")
    .select("user_id")
    .eq("id", keyId)
    .limit(1);

  if (error) throw new Error(error.message);
  if (!rows?.[0] || rows[0].user_id !== user.id) throw new Error("Key not found");

  return user;
}

export async function createShare(keyId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await assertKeyOwner(supabase, keyId);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const permission = String(formData.get("permission") ?? "view");

  if (!email) throw new Error("Email is required");
  if (permission !== "view" && permission !== "edit") throw new Error("Invalid permission");

  const { data: sharee, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!sharee) throw new Error("No user with that email");
  if (sharee.id === user.id) throw new Error("Cannot share a key with yourself");

  const { error: upsertError } = await supabase.from("key_shares").upsert(
    {
      key_id: keyId,
      user_id: sharee.id,
      permission,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key_id,user_id" }
  );

  if (upsertError) throw new Error(upsertError.message);

  await supabase.from("audit_log").insert({
    key_id: keyId,
    actor_id: user.id,
    action: "share",
  });

  revalidatePath("/");
}

export async function updateSharePermission(shareId: string, permission: string) {
  if (permission !== "view" && permission !== "edit") throw new Error("Invalid permission");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: share, error: fetchError } = await supabase
    .from("key_shares")
    .select("id, key_id, user_id")
    .eq("id", shareId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!share) throw new Error("Share not found");

  const { data: key, error: keyError } = await supabase
    .from("keys")
    .select("user_id")
    .eq("id", share.key_id)
    .maybeSingle();

  if (keyError) throw new Error(keyError.message);
  if (!key || key.user_id !== user.id) throw new Error("Share not found");

  const { error: updateError } = await supabase
    .from("key_shares")
    .update({ permission, updated_at: new Date().toISOString() })
    .eq("id", shareId);

  if (updateError) throw new Error(updateError.message);

  await supabase.from("audit_log").insert({
    key_id: share.key_id,
    actor_id: user.id,
    action: "share",
  });

  revalidatePath("/");
}

export async function revokeShare(shareId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: share, error: fetchError } = await supabase
    .from("key_shares")
    .select("id, key_id")
    .eq("id", shareId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!share) throw new Error("Share not found");

  const { data: key, error: keyError } = await supabase
    .from("keys")
    .select("user_id")
    .eq("id", share.key_id)
    .maybeSingle();

  if (keyError) throw new Error(keyError.message);
  if (!key || key.user_id !== user.id) throw new Error("Share not found");

  const { error: deleteError } = await supabase
    .from("key_shares")
    .delete()
    .eq("id", shareId);

  if (deleteError) throw new Error(deleteError.message);

  await supabase.from("audit_log").insert({
    key_id: share.key_id,
    actor_id: user.id,
    action: "revoke",
  });

  revalidatePath("/");
}

export async function listShares(keyId: string): Promise<ShareListItem[]> {
  const supabase = await createClient();
  await assertKeyOwner(supabase, keyId);

  const { data, error } = await supabase
    .from("key_shares")
    .select("id, permission, created_at, profiles!inner(email)")
    .eq("key_id", keyId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profileRows = row.profiles as { email: string }[] | undefined;
    return {
      id: row.id,
      permission: row.permission,
      created_at: row.created_at,
      email: profileRows?.[0]?.email ?? "",
    };
  });
}
