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
  created_at: string;
  updated_at: string;
};

function parseTags(formData: FormData): string[] {
  const raw = String(formData.get("tags") ?? "");
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
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

  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const tags = parseTags(formData);

  if (!name) throw new Error("Name is required");

  const { data: rows, error: fetchError } = await supabase
    .from("keys")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (fetchError) throw new Error(fetchError.message);

  const row: KeyRow | undefined = rows?.[0];
  if (!row || row.user_id !== user.id) throw new Error("Key not found");

  const updates: Partial<KeyRow> = {
    name,
    notes,
    category,
    tags,
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

  const { error } = await supabase.from("keys").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

async function loadKeyValue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: rows, error } = await supabase
    .from("keys")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw new Error(error.message);

  const row: KeyRow | undefined = rows?.[0];
  if (!row || row.user_id !== user.id) throw new Error("Key not found");

  return decryptValue(row.value_encrypted);
}

export async function revealKey(id: string): Promise<string> {
  const supabase = await createClient();
  return loadKeyValue(supabase, id);
}

export async function copyKey(id: string): Promise<string> {
  const supabase = await createClient();
  return loadKeyValue(supabase, id);
}
