import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { proxy } from "../src/proxy.ts";
import { GET } from "../src/app/api/cron/route.ts";

let saved;
beforeEach(() => {
  saved = { ...process.env };
});
afterEach(() => {
  process.env = saved;
});

test("cron bypasses browser authentication even outside demo mode", async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "false";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  const response = await proxy(new NextRequest("http://localhost/api/cron"));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("location"), null);
});

test("missing cron secret cannot authenticate as Bearer undefined", async () => {
  delete process.env.CRON_SECRET;
  const response = await GET(
    new Request("http://localhost/api/cron", {
      headers: { authorization: "Bearer undefined" },
    }),
  );
  assert.equal(response.status, 401);
});

test("cron requires its own token and refuses demo delivery", async () => {
  process.env.CRON_SECRET = "sample-cron-secret";
  process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  assert.equal(
    (await GET(new Request("http://localhost/api/cron"))).status,
    401,
  );
  assert.equal(
    (
      await GET(
        new Request("http://localhost/api/cron", {
          headers: { authorization: "Bearer sample-cron-secret" },
        }),
      )
    ).status,
    503,
  );
});
