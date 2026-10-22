"""Real authentication integration check against Keep's disposable local test users.

Requires the local Supabase CLI stack and an app running in real mode. Never
targets a hosted database; all users created here are removed in finally.
"""
import json
import os
import re
import secrets
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("KEEP_TEST_URL", "http://127.0.0.1:3000")
assert BASE in ("http://127.0.0.1:3000", "http://localhost:3000")
status = json.loads(subprocess.run(
    [str(ROOT / "node_modules/.bin/supabase.cmd"), "status", "--output", "json"],
    cwd=ROOT, capture_output=True, text=True, check=True,
).stdout)
API = status["API_URL"]
assert API == "http://127.0.0.1:55321", "Only the separate local Keep stack is allowed"
env = dict(line.split("=", 1) for line in (ROOT / ".env.local").read_text().splitlines()
           if "=" in line and not line.startswith("#"))
assert env.get("NEXT_PUBLIC_DEMO_MODE") == "false"
assert env.get("NEXT_PUBLIC_SUPABASE_URL") == API
stamp = time.time_ns()
emails = [f"keep-auth-{stamp}-{i}@example.test" for i in range(2)]
password = secrets.token_urlsafe(24)
key_name = f"Auth integration {stamp}"
key_value = "sk-test-" + secrets.token_hex(16)
created = []


def admin(path, method="GET"):
    request = urllib.request.Request(
        API + "/auth/v1/admin/" + path,
        method=method,
        headers={"apikey": status["SERVICE_ROLE_KEY"],
                 "Authorization": "Bearer " + status["SERVICE_ROLE_KEY"]},
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(permissions=["clipboard-read", "clipboard-write"],
                                      reduced_motion="reduce")
        page = context.new_page()
        page.goto(BASE)
        expect(page).to_have_url(re.compile(r"/login$"))
        assert page.get_by_text("Demo workspace", exact=False).count() == 0
        for provider in ["Google", "GitHub"]:
            expect(page.get_by_role("button", name=f"Continue with {provider}", exact=True)).to_be_disabled()

        def signup(target, email):
            target.goto(BASE + "/signup")
            target.get_by_label("Email", exact=True).fill(email)
            target.get_by_label("Password", exact=True).fill(password)
            target.get_by_role("button", name="Create account", exact=True).click()
            expect(target).to_have_url(BASE + "/", timeout=30000)
            expect(target.get_by_role("heading", name="Your first key belongs here.", exact=True)).to_be_visible()

        signup(page, emails[0])
        created.extend(user["id"] for user in admin("users")["users"]
                       if user["email"] == emails[0])
        assert len(created) == 1
        assert any(cookie["name"].startswith("keep-auth") for cookie in context.cookies())
        page.get_by_role("button", name="Add key", exact=True).first.click()
        modal = page.get_by_role("dialog")
        modal.get_by_label("Name", exact=True).fill(key_name)
        modal.get_by_label("Value", exact=True).fill(key_value)
        modal.get_by_role("button", name="Add key", exact=True).click()
        expect(modal).not_to_be_visible()
        row = page.get_by_role("article", name=key_name, exact=True)
        expect(row).to_be_visible()
        request = urllib.request.Request(
            API + "/rest/v1/keys?user_id=eq." + created[0] + "&select=value_encrypted",
            headers={"apikey": status["SERVICE_ROLE_KEY"],
                     "Authorization": "Bearer " + status["SERVICE_ROLE_KEY"]},
        )
        with urllib.request.urlopen(request) as response:
            stored = json.load(response)
        assert len(stored) == 1 and stored[0]["value_encrypted"] != key_value
        row.get_by_role("button", name=f"Reveal {key_name}", exact=True).click()
        expect(row.locator("code")).to_have_text(key_value)
        row.get_by_role("button", name=f"Copy {key_name}", exact=True).click()
        expect(row.get_by_role("button", name=f"Copied {key_name}", exact=True)).to_be_visible()
        assert page.evaluate("navigator.clipboard.readText()") == key_value
        row.locator("summary").click()
        row.get_by_role("button", name="Edit key", exact=True).click()
        row.get_by_label("Notes", exact=True).fill("Persisted through a real login")
        row.get_by_role("button", name="Save", exact=True).click()
        expect(row.get_by_text("Persisted through a real login", exact=True)).to_be_visible()
        page.get_by_role("button", name="Log out", exact=True).click()
        expect(page).to_have_url(re.compile(r"/login$"))
        page.goto(BASE)
        expect(page).to_have_url(re.compile(r"/login$"))
        page.get_by_label("Email", exact=True).fill(emails[0])
        page.get_by_label("Password", exact=True).fill("wrong-password-only")
        page.get_by_role("button", name="Log in", exact=True).click()
        expect(page.get_by_role("alert")).to_be_visible()
        page.get_by_label("Password", exact=True).fill(password)
        page.get_by_role("button", name="Log in", exact=True).click()
        expect(row).to_be_visible(timeout=30000)
        expect(row.get_by_text("Persisted through a real login", exact=True)).to_be_visible()

        second = browser.new_context(reduced_motion="reduce")
        second_page = second.new_page()
        signup(second_page, emails[1])
        assert second_page.get_by_role("article", name=key_name, exact=True).count() == 0
        assert second_page.get_by_role("article").count() == 0
        assert row.count() == 1
        page.get_by_role("button", name=f"Reveal {key_name}", exact=True).click()
        expect(row.locator("code")).to_have_text(key_value)
        page.screenshot(path=str(Path(tempfile.gettempdir()) / "keep-real-auth.png"),
                        full_page=True, animations="disabled")
        browser.close()
    print("PASS: real signup, empty vault, encrypted-key roundtrip, copy, edit, logout, invalid/correct login, persistence, separate users")
finally:
    # Exact generated emails only; never touch existing users in this database.
    for user in admin("users")["users"]:
        if user["email"] in emails:
            admin("users/" + user["id"], method="DELETE")
    print("Temporary local integration accounts removed")
