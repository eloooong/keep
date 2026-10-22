import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const viewer = "22222222-2222-4222-8222-222222222222";
const editor = "33333333-3333-4333-8333-333333333333";
const stranger = "44444444-4444-4444-8444-444444444444";
const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherKey = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

before(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select current_user::text $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
  `);
  const schema = await readFile(
    new URL("../supabase/schema.sql", import.meta.url),
    "utf8",
  );
  await db.exec(schema);
  // Applying the snapshot a second time must also be safe.
  await db.exec(schema);
  await db.query(
    "insert into auth.users (id, email) values ($1, 'owner@example.com'), ($2, 'viewer@example.com'), ($3, 'editor@example.com'), ($4, 'stranger@example.com')",
    [owner, viewer, editor, stranger],
  );
  await db.query(
    "insert into public.keys (id, user_id, name, value_encrypted) values ($1, $2, 'Owner key', 'ciphertext'), ($3, $4, 'Other key', 'ciphertext')",
    [key, owner, otherKey, stranger],
  );
  await db.query(
    "insert into public.key_shares (key_id, owner_id, user_id, permission) values ($1, $2, $3, 'view'), ($1, $2, $4, 'edit')",
    [key, owner, viewer, editor],
  );
});

after(async () => {
  await db.close();
});

test("profile trigger remains internal to Auth", async () => {
  const result = await db.query(`select
    has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE') as anonymous,
    has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') as signed_in`);
  assert.deepEqual(result.rows[0], { anonymous: false, signed_in: false });
});

async function asUser(user, run, role = "authenticated") {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [
      user ?? "",
    ]);
    return await run();
  } finally {
    await db.exec("rollback");
  }
}

test("owners and recipients read their keys; strangers cannot", async () => {
  for (const user of [owner, viewer, editor]) {
    await asUser(user, async () => {
      const { rows } = await db.query(
        "select id from public.keys where id = $1",
        [key],
      );
      assert.equal(rows.length, 1);
    });
  }
  await asUser(stranger, async () => {
    assert.equal(
      (await db.query("select id from public.keys where id = $1", [key])).rows
        .length,
      0,
    );
  });
});

test("forged owner IDs cannot grant access to another person's key", async () => {
  await assert.rejects(
    asUser(stranger, () =>
      db.query(
        "insert into public.key_shares (key_id, owner_id, user_id) values ($1, $2, $2)",
        [key, stranger],
      ),
    ),
    { code: "23503" },
  );
});

test("recipients cannot escalate permissions or create shares", async () => {
  await asUser(viewer, async () => {
    const result = await db.query(
      "update public.key_shares set permission = 'edit' where key_id = $1 returning id",
      [key],
    );
    assert.equal(result.rows.length, 0);
  });
  await assert.rejects(
    asUser(editor, () =>
      db.query(
        "insert into public.key_shares (key_id, owner_id, user_id) values ($1, $2, $3)",
        [key, owner, stranger],
      ),
    ),
    { code: "42501" },
  );
});

test("editors can change content, viewers cannot; neither can delete", async () => {
  await asUser(editor, async () => {
    assert.equal(
      (
        await db.query(
          "update public.keys set name = 'Edited' where id = $1 returning id",
          [key],
        )
      ).rows.length,
      1,
    );
  });
  await asUser(viewer, async () => {
    assert.equal(
      (
        await db.query(
          "update public.keys set name = 'Edited' where id = $1 returning id",
          [key],
        )
      ).rows.length,
      0,
    );
  });
  for (const user of [viewer, editor]) {
    await asUser(user, async () => {
      assert.equal(
        (
          await db.query("delete from public.keys where id = $1 returning id", [
            key,
          ])
        ).rows.length,
        0,
      );
    });
  }
});

test("editors cannot take ownership or change a key's identity", async () => {
  await assert.rejects(
    asUser(editor, () =>
      db.query("update public.keys set user_id = $1 where id = $2", [
        editor,
        key,
      ]),
    ),
    { code: "42501" },
  );
  await assert.rejects(
    asUser(editor, () =>
      db.query("update public.keys set id = gen_random_uuid() where id = $1", [
        key,
      ]),
    ),
    { code: "42501" },
  );
});

test("owners can invite, change permissions, and revoke", async () => {
  await asUser(owner, async () => {
    await db.query(
      "insert into public.key_shares (key_id, owner_id, user_id) values ($1, $2, $3)",
      [key, owner, stranger],
    );
    assert.equal(
      (
        await db.query(
          "update public.key_shares set permission = 'edit' where key_id = $1 and user_id = $2 returning id",
          [key, stranger],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.key_shares where key_id = $1 and user_id = $2 returning id",
          [key, stranger],
        )
      ).rows.length,
      1,
    );
  });
});

test("browser roles cannot read or write delivery records", async () => {
  for (const role of ["anon", "authenticated"]) {
    await assert.rejects(
      asUser(
        owner,
        () => db.query("select * from public.email_reminders"),
        role,
      ),
      { code: "42501" },
    );
    await assert.rejects(
      asUser(
        owner,
        () =>
          db.query(
            "insert into public.email_reminders (key_id, user_id) values ($1, $2)",
            [key, owner],
          ),
        role,
      ),
      { code: "42501" },
    );
  }
  await asUser(
    null,
    async () => {
      await db.query(
        "insert into public.email_reminders (key_id, user_id) values ($1, $2)",
        [key, owner],
      );
      assert.equal(
        (await db.query("select * from public.email_reminders")).rows.length,
        1,
      );
    },
    "service_role",
  );
});

test("profile emails cannot be spoofed through browser writes", async () => {
  await assert.rejects(
    asUser(viewer, () =>
      db.query(
        "update public.profiles set email = 'owner@example.com' where id = $1",
        [viewer],
      ),
    ),
    { code: "42501" },
  );
});

test("dismissals require access to the key", async () => {
  await asUser(viewer, () =>
    db.query(
      "insert into public.key_dismissals (key_id, user_id) values ($1, $2)",
      [key, viewer],
    ),
  );
  await assert.rejects(
    asUser(viewer, () =>
      db.query(
        "insert into public.key_dismissals (key_id, user_id) values ($1, $2)",
        [otherKey, viewer],
      ),
    ),
    { code: "42501" },
  );
});

test("profile directory is private; owners can resolve exact invitees", async () => {
  await asUser(viewer, async () => {
    const { rows } = await db.query("select id from public.profiles");
    assert.deepEqual(
      rows.map((row) => row.id),
      [viewer],
    );
  });
  await asUser(owner, async () => {
    const { rows } = await db.query(
      "select public.find_share_recipient($1, ' VIEWER@example.com ') as id",
      [key],
    );
    assert.equal(rows[0].id, viewer);
    assert.equal(
      (
        await db.query("select email from public.profiles where id = $1", [
          viewer,
        ])
      ).rows.length,
      1,
    );
  });
  await assert.rejects(
    asUser(viewer, () =>
      db.query(
        "select public.find_share_recipient($1, 'stranger@example.com')",
        [key],
      ),
    ),
    { code: "42501" },
  );
});

test("audit events follow mutations and survive deletion without storing secrets", async () => {
  await asUser(owner, async () => {
    const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    await db.query(
      "insert into public.keys (id, user_id, name, value_encrypted) values ($1, $2, 'Temporary', 'secret-ciphertext')",
      [id, owner],
    );
    await db.query("update public.keys set name = 'Renamed' where id = $1", [
      id,
    ]);
    await db.query("delete from public.keys where id = $1", [id]);
    const { rows } = await db.query(
      "select * from public.audit_log where key_name in ('Temporary', 'Renamed') order by id",
    );
    assert.deepEqual(
      rows.map((row) => row.action),
      ["create", "edit", "delete"],
    );
    assert.ok(
      rows.every((row) => row.key_id === null && row.owner_id === owner),
    );
    assert.ok(!JSON.stringify(rows).includes("secret-ciphertext"));
  });
});

test("audit log cannot be forged, altered, or cleared by browser roles", async () => {
  await assert.rejects(
    asUser(owner, () =>
      db.query(
        "insert into public.audit_log (key_id, actor_id, action) values ($1, $2, 'copy')",
        [key, owner],
      ),
    ),
    { code: "42501" },
  );
  await assert.rejects(
    asUser(owner, () =>
      db.query("update public.audit_log set action = 'view'"),
    ),
    { code: "42501" },
  );
  await assert.rejects(
    asUser(owner, () => db.query("delete from public.audit_log")),
    { code: "42501" },
  );
});

test("key access is authorized and rate-limited for shared recipients", async () => {
  await asUser(viewer, async () => {
    for (let i = 0; i < 20; i++)
      await db.query("select public.record_key_access($1, 'view')", [key]);
    const { rows } = await db.query(
      "select * from public.audit_log where actor_id = $1",
      [viewer],
    );
    assert.equal(rows.length, 20);
    assert.ok(
      rows.every(
        (row) => row.action === "view" && row.key_name === "Owner key",
      ),
    );
    await assert.rejects(
      db.query("select public.record_key_access($1, 'copy')", [key]),
      /Rate limit exceeded/,
    );
  });
  await assert.rejects(
    asUser(stranger, () =>
      db.query("select public.record_key_access($1, 'view')", [key]),
    ),
    { code: "42501" },
  );
  await assert.rejects(
    asUser(viewer, () =>
      db.query("select public.record_key_access($1, 'delete')", [key]),
    ),
    { code: "42501" },
  );
});

test("renewing an expiry permits a new delivery record", async () => {
  await asUser(
    null,
    async () => {
      await db.query(
        "insert into public.email_reminders (key_id, user_id, expires_at) values ($1, $2, '2026-10-24'), ($1, $2, '2026-10-25')",
        [key, owner],
      );
      assert.equal(
        (
          await db.query(
            "select * from public.email_reminders where key_id = $1",
            [key],
          )
        ).rows.length,
        2,
      );
    },
    "service_role",
  );
});

test("account deletion can cascade without audit foreign-key failures", async () => {
  await db.exec("begin");
  try {
    await db.query("delete from auth.users where id = $1", [owner]);
    assert.equal(
      (await db.query("select id from public.keys where user_id = $1", [owner]))
        .rows.length,
      0,
    );
    assert.equal(
      (
        await db.query("select id from public.audit_log where owner_id = $1", [
          owner,
        ])
      ).rows.length,
      0,
    );
  } finally {
    await db.exec("rollback");
  }
});
