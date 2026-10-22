import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { isDemoMode } from "../src/utils/demo/isDemo.ts";
import { getSupabaseConfig } from "../src/utils/config.ts";
import {
  encryptValue,
  decryptValue,
  getEncryptionKey,
} from "../src/utils/crypto.ts";

let saved;
beforeEach(() => {
  saved = { ...process.env };
});
afterEach(() => {
  process.env = saved;
});

test("missing credentials never enable a demo", () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "false";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
  assert.equal(isDemoMode(), false);
  assert.throws(getSupabaseConfig, /NEXT_PUBLIC_SUPABASE/);
});

test("real encryption requires a strictly valid key", () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "false";
  for (const key of ["", "ab", "z".repeat(64), "ab".repeat(32) + "zz"]) {
    process.env.ENCRYPTION_KEY = key;
    assert.throws(getEncryptionKey, /64 hexadecimal/);
  }
  process.env.ENCRYPTION_KEY = "ab".repeat(32);
  const encrypted = encryptValue("a secret");
  assert.equal(decryptValue(encrypted), "a secret");
  assert.notEqual(encrypted, encryptValue("a secret"));
  const modified = Buffer.from(encrypted, "base64url");
  modified[modified.length - 1] ^= 1;
  assert.throws(() => decryptValue(modified.toString("base64url")));
});

test("explicit demo can encrypt disposable values without production secrets", () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  process.env.ENCRYPTION_KEY = "";
  assert.equal(isDemoMode(), true);
  assert.equal(decryptValue(encryptValue("demo")), "demo");
});
