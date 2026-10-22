import type { SupabaseClient } from "@supabase/supabase-js";

type Delivery = { from: string; to: string; subject: string; html: string };
type Send = (
  email: Delivery,
  options: { idempotencyKey: string },
) => Promise<{ error: unknown }>;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}

export async function sendExpiryReminders(
  supabase: SupabaseClient,
  send: Send,
  config: { from: string; appUrl: string; now?: Date },
) {
  const now = config.now ?? new Date();
  const { data: keys, error } = await supabase
    .from("keys")
    .select("id, name, expires_at, user_id")
    .gt("expires_at", now.toISOString())
    .lte("expires_at", new Date(now.getTime() + 7 * 86_400_000).toISOString());
  if (error) throw new Error("Unable to load expiring keys");
  if (!keys?.length) return { sent: 0, failed: 0 };

  const { data: reminders, error: reminderError } = await supabase
    .from("email_reminders")
    .select("key_id, user_id, expires_at")
    .in(
      "key_id",
      keys.map((key) => key.id),
    );
  if (reminderError) throw new Error("Unable to load reminder history");
  const identity = (id: string, user: string, expiry: string) =>
    `${id}:${user}:${new Date(expiry).getTime()}`;
  const delivered = new Set(
    (reminders ?? [])
      .filter((row) => row.expires_at)
      .map((row) => identity(row.key_id, row.user_id, row.expires_at)),
  );

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", [...new Set(keys.map((key) => key.user_id))]);
  if (profileError) throw new Error("Unable to load reminder recipients");
  const emails = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.email]),
  );
  let sent = 0;
  let failed = 0;

  for (const key of keys) {
    const id = identity(key.id, key.user_id, key.expires_at);
    if (delivered.has(id)) continue;
    const to = emails.get(key.user_id);
    if (!to) {
      failed++;
      continue;
    }
    const date = new Date(key.expires_at).toLocaleDateString("en-US", {
      dateStyle: "long",
      timeZone: "UTC",
    });
    try {
      const result = await send(
        {
          from: config.from,
          to,
          subject: `Your API key "${key.name}" expires on ${date}`,
          html: `<html><body><h2>API key expiry reminder</h2><p>Your key <strong>${escapeHtml(key.name)}</strong> expires on <strong>${date} (UTC)</strong>.</p><p>Rotate it with your provider, then update the saved key in Keep.</p><p><a href="${escapeHtml(config.appUrl)}">Open Keep</a></p></body></html>`,
        },
        { idempotencyKey: `keep-expiry:${id}` },
      );
      if (result.error) {
        failed++;
        continue;
      }
      const { error: saveError } = await supabase
        .from("email_reminders")
        .upsert(
          {
            key_id: key.id,
            user_id: key.user_id,
            expires_at: key.expires_at,
          },
          { onConflict: "key_id,user_id,expires_at" },
        );
      if (saveError) {
        failed++;
        continue;
      }
      delivered.add(id);
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
