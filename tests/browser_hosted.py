"""Opt-in hosted verification using temporary accounts, never existing users.

KEEP_HOSTED_TEST_URL must identify the Keep deployment. API credentials are
read into memory from the authenticated Supabase CLI and are never printed.
Optional KEEP_PROTECTION_HEADERS points to an ignored Vercel curl header file.
"""
import json
import os
import secrets
import subprocess
import time
import urllib.parse
import urllib.request
from http.cookies import SimpleCookie
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

assert os.environ.get("KEEP_HOSTED_TEST") == "1", "Hosted checks require explicit opt-in"
BASE = os.environ["KEEP_HOSTED_TEST_URL"].rstrip("/")
host = urllib.parse.urlparse(BASE)
assert host.scheme == "https" and host.hostname and host.hostname.startswith("keep-") and host.hostname.endswith(".vercel.app")
ROOT = Path(__file__).resolve().parents[1]
PROJECT = "fweknktbymdyozvhbrnk"
API = f"https://{PROJECT}.supabase.co"
raw = subprocess.run(
    [str(ROOT / "node_modules/.bin/supabase.cmd"), "projects", "api-keys",
     "--project-ref", PROJECT, "--output", "json"],
    capture_output=True, text=True, check=True,
).stdout
payload = json.loads(raw)
keys = payload.get("keys", []) if isinstance(payload, dict) else payload
service = next(key["api_key"] for key in keys if key.get("name") == "service_role")
stamp = time.time_ns()
emails = [f"keep-deploy-{stamp}-{index}@example.test" for index in range(2)]
password = secrets.token_urlsafe(24)
created = []
name = f"Deployment verification {stamp}"
value = "sk-verification-" + secrets.token_hex(12)


def admin(path, method="GET", body=None):
    request = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": service, "Authorization": "Bearer " + service,
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def bypass_cookies(context):
    filename = os.environ.get("KEEP_PROTECTION_HEADERS")
    if not filename:
        return
    for line in Path(filename).read_text().splitlines():
        if line.lower().startswith("set-cookie:"):
            cookie = SimpleCookie()
            cookie.load(line.split(":", 1)[1].strip())
            for key, morsel in cookie.items():
                if key == "_vercel_jwt":
                    context.add_cookies([{"name": key, "value": morsel.value,
                                          "url": BASE, "secure": True,
                                          "httpOnly": True, "sameSite": "Lax"}])


try:
    for email in emails:
        user = admin("/auth/v1/admin/users", "POST",
                     {"email": email, "password": password, "email_confirm": True})
        created.append(user["id"])
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        owner_context = browser.new_context(reduced_motion="reduce")
        bypass_cookies(owner_context)
        page = owner_context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        def login(target, email):
            target.goto(BASE + "/login")
            target.get_by_label("Email", exact=True).fill(email)
            target.get_by_label("Password", exact=True).fill(password)
            target.get_by_role("button", name="Log in", exact=True).click()
            expect(target.get_by_role("heading", name="API keys", exact=True)).to_be_visible(timeout=30000)

        page.goto(BASE)
        expect(page).to_have_url(BASE + "/login")
        for provider in ["Google", "GitHub"]:
            expect(page.get_by_role("button", name=f"Continue with {provider}", exact=True)).to_be_enabled()
        assert page.get_by_role("button", name="Continue with Apple", exact=True).count() == 0
        assert page.get_by_text("Demo workspace", exact=False).count() == 0
        login(page, emails[0])
        expect(page.get_by_role("heading", name="Your first key belongs here.", exact=True)).to_be_visible()
        page.get_by_role("button", name="Add key", exact=True).first.click()
        modal = page.get_by_role("dialog")
        modal.get_by_label("Name", exact=True).fill(name)
        modal.get_by_label("Value", exact=True).fill(value)
        modal.get_by_role("button", name="Add key", exact=True).click()
        expect(modal).not_to_be_visible(timeout=30000)
        row = page.get_by_role("article", name=name, exact=True)
        expect(row).to_be_visible()
        row.get_by_role("button", name=f"Reveal {name}", exact=True).click()
        expect(row.locator("code")).to_have_text(value, timeout=15000)
        stored = admin("/rest/v1/keys?user_id=eq." + created[0] + "&select=value_encrypted")
        assert len(stored) == 1 and stored[0]["value_encrypted"] != value
        page.get_by_role("button", name="Log out", exact=True).click()
        expect(page).to_have_url(BASE + "/login")
        login(page, emails[0])
        expect(row).to_be_visible()

        recipient_context = browser.new_context(reduced_motion="reduce")
        bypass_cookies(recipient_context)
        recipient = recipient_context.new_page()
        login(recipient, emails[1])
        assert recipient.get_by_role("article").count() == 0
        row.locator("summary").click()
        row.get_by_role("button", name="Manage sharing", exact=True).click()
        row.get_by_label("Recipient email", exact=True).fill(emails[1])
        row.get_by_role("button", name="Add", exact=True).click()
        expect(row.get_by_text(emails[1], exact=True)).to_be_visible(timeout=15000)
        recipient.reload()
        shared = recipient.get_by_role("article", name=name, exact=True)
        expect(shared).to_be_visible(timeout=15000)
        expect(shared.get_by_text("View only", exact=True)).to_be_visible()
        assert shared.locator("summary").count() == 0
        page.once("dialog", lambda dialog: dialog.accept())
        row.get_by_role("button", name="Revoke", exact=True).click()
        expect(row.get_by_text("Not shared with anyone yet.", exact=True)).to_be_visible()
        recipient.reload()
        expect(shared).not_to_be_visible()
        for target in [page, recipient]:
            target.get_by_role("button", name="Log out", exact=True).click()
            expect(target).to_have_url(BASE + "/login")
        assert not errors, errors
        browser.close()
    print("PASS: hosted login/logout, saved encrypted keys, persistence, account isolation, sharing/revocation, Google/GitHub ready and Apple removed")
finally:
    for user_id in created:
        admin("/auth/v1/admin/users/" + user_id, "DELETE")
    print("Only temporary hosted verification users removed")
