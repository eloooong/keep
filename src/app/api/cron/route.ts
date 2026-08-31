import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/utils/supabase/service";

const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@apikeysaver.app";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 503 }
    );
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Resend API key not configured" },
      { status: 503 }
    );
  }

  const supabase = createServiceClient();
  const resend = new Resend(RESEND_API_KEY);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: expiringKeys, error: keysError } = await supabase
    .from("keys")
    .select("id, name, expires_at, user_id")
    .not("expires_at", "is", null)
    .gt("expires_at", now.toISOString())
    .lte("expires_at", sevenDaysFromNow.toISOString());

  if (keysError) {
    return NextResponse.json({ error: keysError.message }, { status: 500 });
  }

  if (!expiringKeys || expiringKeys.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: existingReminders } = await supabase
    .from("email_reminders")
    .select("key_id");

  const alreadySent = new Set(
    (existingReminders ?? []).map((r) => r.key_id)
  );

  let sent = 0;

  for (const key of expiringKeys) {
    if (alreadySent.has(key.id)) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", key.user_id)
      .single();

    if (!profile?.email) continue;

    const expiryDate = new Date(key.expires_at!).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #171717;">
  <h2 style="margin-bottom: 16px;">API Key Expiry Reminder</h2>
  <p>Your API key <strong>${key.name}</strong> will expire on <strong>${expiryDate}</strong>.</p>
  <p>Please update or delete this key before it expires to avoid service disruptions.</p>
  <p style="margin-top: 24px;">
    <a href="${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"}"
       style="display: inline-block; padding: 10px 20px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">
      Go to Dashboard
    </a>
  </p>
  <p style="margin-top: 24px; font-size: 12px; color: #737373;">This is an automated reminder from API Key Saver.</p>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject: `Your API key "${key.name}" expires on ${expiryDate}`,
        html,
      });

      await supabase.from("email_reminders").insert({
        key_id: key.id,
        user_id: key.user_id,
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send email for key ${key.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
