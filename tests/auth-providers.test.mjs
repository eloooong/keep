import { test } from "node:test";
import assert from "node:assert/strict";
import { getEnabledAuthProviders } from "../src/utils/auth-providers.ts";

test("social sign-in stays disabled without provider configuration", () => {
  assert.deepEqual(getEnabledAuthProviders(""), []);
  assert.deepEqual(getEnabledAuthProviders("false,all,facebook,GOOGLE"), []);
});

test("Google and GitHub can be enabled independently; Apple stays unavailable", () => {
  for (const provider of ["google", "github"]) {
    assert.deepEqual(getEnabledAuthProviders(provider), [provider]);
  }
  assert.deepEqual(
    getEnabledAuthProviders(" apple,github, google,apple,invalid "),
    ["google", "github"],
  );
});
