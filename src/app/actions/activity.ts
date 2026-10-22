"use server";

import { createClient } from "@/utils/supabase/server";

export type ActivityRow = {
  id: number;
  action: string;
  created_at: string;
  keyId: string | null;
  keyName: string | null;
  actorEmail: string | null;
};

export async function getActivity(limit = 50): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, created_at, key_id, key_name, actor_email")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(Math.trunc(limit) || 50, 1), 200));

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const raw = row as {
      id: number;
      action: string;
      created_at: string;
      key_id: string | null;
      key_name: string | null;
      actor_email: string | null;
    };
    return {
      id: raw.id,
      action: raw.action,
      created_at: raw.created_at,
      keyId: raw.key_id,
      keyName: raw.key_name,
      actorEmail: raw.actor_email,
    };
  });
}
