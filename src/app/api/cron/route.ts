import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/utils/supabase/service";
import { isDemoMode } from "@/utils/demo/isDemo";
import { sendExpiryReminders } from "@/utils/reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (isDemoMode() || !apiKey || !from || !appUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Reminder service is not configured" }, { status: 503 });
  }
  try {
    const url = new URL(appUrl);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) {
      throw new Error("APP_URL must use HTTPS in production");
    }
    const resend = new Resend(apiKey);
    const result = await sendExpiryReminders(createServiceClient(), (email, options) => resend.emails.send(email, options), { from, appUrl: url.origin });
    return NextResponse.json(result, { status: result.failed ? 502 : 200 });
  } catch {
    return NextResponse.json({ error: "Reminder delivery failed. Check configuration and retry." }, { status: 500 });
  }
}
