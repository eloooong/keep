"use server";

import { createClient } from "@/utils/supabase/server";

export type ActivityRow = {
  id: number;
  action: string;
  created_at: string;
  keyId: string | null;
  keyName: string | null;
};

export async function getActivity(limit = 50): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, created_at, key_id, keys!left(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const raw = row as {
      id: number;
      action: string;
      created_at: string;
      key_id: string | null;
      keys: { name: string } | { name: string }[] | null;
    };
    return {
      id: raw.id,
      action: raw.action,
      created_at: raw.created_at,
      keyId: raw.key_id,
      keyName: Array.isArray(raw.keys) ? raw.keys[0]?.name ?? null : raw.keys?.name ?? null,
    };
  });
}
