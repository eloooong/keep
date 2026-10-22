import { test } from "node:test";
import assert from "node:assert/strict";
import { sendExpiryReminders } from "../src/utils/reminders.ts";

const config = {
  from: "Keep <test@example.com>",
  appUrl: "https://keep.example.com",
  now: new Date("2026-10-22T00:00:00Z"),
};
function fixture({
  history = [],
  sendError = null,
  readError = null,
  writeError = null,
} = {}) {
  const key = {
    id: "key",
    user_id: "owner",
    name: '<img src=x onerror="bad()">',
    expires_at: "2026-10-25T00:00:00Z",
  };
  const writes = [],
    deliveries = [];
  const client = {
    from(table) {
      const result = {
        keys: [key],
        profiles: [{ id: "owner", email: "owner@example.com" }],
        email_reminders: history,
      };
      const query = {
        select() {
          return this;
        },
        gt() {
          return this;
        },
        lte() {
          return this;
        },
        in() {
          return this;
        },
        upsert(row) {
          writes.push(row);
          return Promise.resolve({ error: writeError });
        },
        then(resolve, reject) {
          return Promise.resolve({
            data: result[table],
            error: table === "email_reminders" ? readError : null,
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const send = async (email, options) => {
    deliveries.push({ email, options });
    return { error: sendError };
  };
  return {
    key,
    writes,
    deliveries,
    run: () => sendExpiryReminders(client, send, config),
  };
}

test("successful reminders escape HTML and use a stable provider idempotency key", async () => {
  const f = fixture();
  assert.deepEqual(await f.run(), { sent: 1, failed: 0 });
  assert.equal(f.writes.length, 1);
  assert.ok(f.deliveries[0].email.html.includes("&lt;img"));
  assert.ok(!f.deliveries[0].email.html.includes("<img"));
  const id = f.deliveries[0].options.idempotencyKey;
  await f.run();
  assert.equal(f.deliveries[1].options.idempotencyKey, id);
});

test("returned provider errors never mark a reminder as sent", async () => {
  const f = fixture({ sendError: { message: "Provider rejected request" } });
  assert.deepEqual(await f.run(), { sent: 0, failed: 1 });
  assert.equal(f.writes.length, 0);
});

test("history lookup errors stop delivery; save errors are reported", async () => {
  const f = fixture({ readError: { message: "Database unavailable" } });
  await assert.rejects(f.run, /history/);
  assert.equal(f.deliveries.length, 0);
  assert.deepEqual(
    await fixture({ writeError: { message: "Database unavailable" } }).run(),
    { sent: 0, failed: 1 },
  );
});

test("same expiry is deduplicated, but a renewed expiry sends again", async () => {
  const same = fixture({
    history: [
      {
        key_id: "key",
        user_id: "owner",
        expires_at: "2026-10-25T00:00:00+00:00",
      },
    ],
  });
  assert.deepEqual(await same.run(), { sent: 0, failed: 0 });
  const renewed = fixture({
    history: [
      { key_id: "key", user_id: "owner", expires_at: "2026-10-24T00:00:00Z" },
    ],
  });
  assert.deepEqual(await renewed.run(), { sent: 1, failed: 0 });
});
