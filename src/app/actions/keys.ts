"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { encryptValue, decryptValue } from "@/utils/crypto";

type KeyRow = {
  id: string;
  user_id: string;
  name: string;
  value_encrypted: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type AuthzResult = {
  permitted: boolean;
  isOwner: boolean;
  permission: "view" | "edit" | null;
};

async function isOwnerOrShare(
  supabase: Awaited<ReturnType<typeof createClient>>,
  keyId: string,
  userId: string,
  requiredPermission?: "view" | "edit",
): Promise<AuthzResult> {
  const { data: rows, error } = await supabase
    .from("keys")
    .select("user_id")
    .eq("id", keyId)
    .limit(1);

  if (error) throw new Error(error.message);

  const row = rows?.[0];
  if (!row) return { permitted: false, isOwner: false, permission: null };

  if (row.user_id === userId) {
    return { permitted: true, isOwner: true, permission: "edit" };
  }

  const { data: share, error: shareError } = await supabase
    .from("key_shares")
    .select("permission")
    .eq("key_id", keyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (shareError) throw new Error(shareError.message);
  if (!share) return { permitted: false, isOwner: false, permission: null };

  const sharePerm = share.permission as "view" | "edit";

  if (requiredPermission === "edit" && sharePerm !== "edit") {
    return { permitted: false, isOwner: false, permission: sharePerm };
  }

  return { permitted: true, isOwner: false, permission: sharePerm };
}

function parseTags(formData: FormData): string[] {
  const raw = String(formData.get("tags") ?? "");
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parseExpiry(formData: FormData): string | null {
  const raw = String(formData.get("expires_at") ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createKey(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const tags = parseTags(formData);
  const expires_at = parseExpiry(formData);

  if (!name) throw new Error("Name is required");
  if (!value) throw new Error("Value is required");

  const now = new Date().toISOString();
  const valueEncrypted = encryptValue(value);

  const { error } = await supabase.from("keys").insert({
    user_id: user.id,
    name,
    value_encrypted: valueEncrypted,
    notes,
    category,
    tags,
    expires_at,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function updateKey(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { permitted } = await isOwnerOrShare(supabase, id, user.id, "edit");
  if (!permitted) throw new Error("Key not found");

  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const tags = parseTags(formData);
  const expires_at = parseExpiry(formData);

  if (!name) throw new Error("Name is required");

  const updates: Partial<KeyRow> = {
    name,
    notes,
    category,
    tags,
    expires_at,
    updated_at: new Date().toISOString(),
  };

  if (value) {
    updates.value_encrypted = encryptValue(value);
  }

  const { error: updateError } = await supabase
    .from("keys")
    .update(updates)
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
}

export async function deleteKey(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { isOwner } = await isOwnerOrShare(supabase, id, user.id);
  if (!isOwner) throw new Error("Only the owner can delete this key");

  const { error } = await supabase.from("keys").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

async function loadKeyValue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  action: "view" | "copy",
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { permitted } = await isOwnerOrShare(supabase, id, user.id, "view");
  if (!permitted) throw new Error("Key not found");

  const { error: accessError } = await supabase.rpc("record_key_access", {
    p_key_id: id,
    p_action: action,
  });
  if (accessError) throw new Error(accessError.message);

  const { data: rows, error } = await supabase
    .from("keys")
    .select("value_encrypted, expires_at")
    .eq("id", id)
    .limit(1);

  if (error) throw new Error(error.message);
  if (!rows?.[0]) throw new Error("Key not found");

  const row = rows[0];
  if (row.expires_at && new Date(row.expires_at) <= new Date()) {
    throw new Error(
      "This key has expired and can no longer be revealed or copied.",
    );
  }

  return decryptValue(row.value_encrypted);
}

export async function revealKey(id: string): Promise<string> {
  return loadKeyValue(await createClient(), id, "view");
}

export async function copyKey(id: string): Promise<string> {
  return loadKeyValue(await createClient(), id, "copy");
}

export async function dismissKeyReminder(keyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("key_dismissals")
    .upsert(
      { key_id: keyId, user_id: user.id },
      { onConflict: "key_id,user_id" },
    );
  if (error)
    throw new Error("Unable to dismiss this reminder. Please try again.");
  revalidatePath("/");
}

export async function undismissKeyReminder(keyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("key_dismissals")
    .delete()
    .eq("key_id", keyId)
    .eq("user_id", user.id);
  if (error)
    throw new Error("Unable to restore this reminder. Please try again.");
  revalidatePath("/");
}

export async function dismissAllKeyReminders(keyIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dismissals = keyIds.map((keyId) => ({
    key_id: keyId,
    user_id: user.id,
  }));

  const { error } = await supabase.from("key_dismissals").upsert(dismissals, {
    onConflict: "key_id,user_id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error("Unable to dismiss reminders. Please try again.");
  revalidatePath("/");
}
