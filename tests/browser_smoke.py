"""Run against an explicitly enabled demo; no real account or email changes."""
import os
import re
import tempfile
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("KEEP_TEST_URL", "http://localhost:3000")
assert os.environ.get("KEEP_TEST_DEMO_MODE") == "true", "Explicit demo-test opt-in required"
OUTPUT = Path(tempfile.gettempdir()) / "keep-smoke"
OUTPUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, permissions=["clipboard-read", "clipboard-write"])
    # Legacy light-mode settings must not override the dark-only interface.
    context.add_init_script("localStorage.setItem('theme', 'light')")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    expect(page.locator(".account-email")).to_have_attribute("title", "demo@keep.app")
    assert page.locator(".demo-notice").count() == 0
    expect(page.locator(".vault-header")).to_be_visible()
    assert page.get_by_role("button", name="Pause effects", exact=True).count() == 0
    pointer_row = page.get_by_role("article", name="GitHub Personal Token", exact=True)
    pointer_row.hover()
    assert pointer_row.evaluate("el => el.style.getPropertyValue('--mouse-x')")

    # Authentication for the cron route must not turn into a login redirect.
    response = context.request.get(f"{BASE}/api/cron", max_redirects=0)
    assert response.status == 401, response.status
    response = context.request.get(f"{BASE}/api/cron", headers={"Authorization": "Bearer undefined"}, max_redirects=0)
    assert response.status == 401, response.status

    shared = page.get_by_role("article", name="Team Analytics", exact=True)
    expect(shared.get_by_text("View only", exact=True)).to_be_visible()
    assert shared.locator("summary").count() == 0
    expired = page.get_by_role("article", name="Resend Transactional", exact=True)
    expect(expired.get_by_role("button", name="Copy Resend Transactional", exact=True)).to_be_disabled()

    page.keyboard.press("/")
    expect(page.get_by_role("searchbox")).to_be_focused()
    page.get_by_role("searchbox").fill("no-matching-key-at-all")
    expect(page.get_by_text("No keys here yet.", exact=True)).to_be_visible()
    page.get_by_role("button", name="Clear filters", exact=True).first.click()

    add = page.get_by_role("button", name="Add key", exact=True).first
    add.click()
    modal = page.get_by_role("dialog")
    expect(modal).to_be_visible()
    page.keyboard.press("Shift+Tab")
    assert page.evaluate("Boolean(document.activeElement.closest('[role=dialog]'))")
    page.keyboard.press("Escape")
    expect(modal).not_to_be_visible()
    expect(add).to_be_focused()

    name = f"Smoke Key {time.time_ns()}"
    add.click()
    modal.get_by_label("Name", exact=True).fill(name)
    modal.get_by_label("Value", exact=True).fill("sk-demo-smoke-only")
    modal.get_by_label("Notes", exact=True).fill("Temporary browser verification")
    modal.get_by_label("Category", exact=True).fill("Testing")
    modal.get_by_role("button", name="Add key", exact=True).click()
    expect(modal).not_to_be_visible()
    row = page.get_by_role("article", name=name, exact=True)
    expect(row).to_be_visible()
    row.get_by_role("button", name=f"Reveal {name}", exact=True).click()
    expect(row.locator("code")).to_have_text("sk-demo-smoke-only")
    row.get_by_role("button", name=f"Hide {name}", exact=True).click()
    row.get_by_role("button", name=f"Copy {name}", exact=True).click()
    expect(row.get_by_role("button", name=f"Copied {name}", exact=True)).to_be_visible()

    row.locator("summary").click()
    row.get_by_role("button", name="Edit key", exact=True).click()
    row.get_by_label("Notes", exact=True).fill("Updated browser verification")
    row.get_by_role("button", name="Save", exact=True).click()
    expect(row.get_by_text("Updated browser verification", exact=True)).to_be_visible()

    row.locator("summary").click()
    row.get_by_role("button", name="Manage sharing", exact=True).click()
    row.get_by_label("Recipient email", exact=True).fill("teammate@keep.app")
    row.get_by_role("button", name="Add", exact=True).click()
    expect(row.get_by_text("teammate@keep.app", exact=True)).to_be_visible()
    permission = row.get_by_label("Permission for teammate@keep.app", exact=True)
    permission.select_option("edit")
    expect(permission).to_have_value("edit")
    page.once("dialog", lambda dialog: dialog.accept())
    row.get_by_role("button", name="Revoke", exact=True).click()
    expect(row.get_by_text("Not shared with anyone yet.", exact=True)).to_be_visible()
    row.get_by_role("button", name="Close", exact=True).click()

    row.locator("summary").click()
    row.get_by_role("button", name="Delete key", exact=True).click()
    row.get_by_role("button", name="Delete key", exact=True).last.click()
    expect(row).not_to_be_visible()
    page.get_by_role("link", name="Activity", exact=True).click()
    expect(page.locator(".activity-row").filter(has_text=name).first).to_be_visible()
    page.get_by_label("Filter activity").select_option("delete")
    expect(page.locator(".activity-row").filter(has_text=name)).to_be_visible()
    timezone_context = browser.new_context(timezone_id="America/New_York", reduced_motion="reduce")
    timezone_page = timezone_context.new_page()
    timezone_page.on("pageerror", lambda error: errors.append(str(error)))
    timezone_page.goto(f"{BASE}/activity", wait_until="networkidle")
    expect(timezone_page.locator("time").first).to_be_visible()
    timezone_context.close()
    page.get_by_role("link", name="All keys", exact=True).click()
    expect(page.get_by_role("heading", name="API keys", exact=True)).to_be_visible()

    # Layout, theme, and reduced motion at actual rendered sizes.
    for width in [1440, 1024, 768, 390, 320]:
        page.set_viewport_size({"width": width, "height": 1000})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"overflow at {width}"
    page.set_viewport_size({"width": 390, "height": 844})
    expect(page.locator(".vault-summary strong span[aria-hidden=true]").first).to_have_text(str(page.get_by_role("article").count()))
    expect(page.locator("html")).to_have_class(re.compile("dark"))
    assert page.get_by_role("button", name=re.compile("Switch to .* mode")).count() == 0
    for token in ["--background", "--surface", "--sidebar", "--accent", "--foreground", "--muted"]:
        color = page.evaluate("token => getComputedStyle(document.documentElement).getPropertyValue(token).trim()", token)
        if re.fullmatch(r"#[0-9a-f]{3}", color):
            color = "#" + "".join(channel * 2 for channel in color[1:])
        assert re.fullmatch(r"#[0-9a-f]{6}", color), (token, color)
        assert color[1:3] == color[3:5] == color[5:7], (token, color)
    page.screenshot(path=str(OUTPUT / "mobile-dark.png"), full_page=True, animations="disabled")
    page.emulate_media(reduced_motion="reduce")
    expect(page.locator(".vault-header .threads-container")).to_have_attribute("data-running", "false")
    expect(page.locator(".vault-header .star-border")).to_have_attribute("data-paused", "true")
    assert pointer_row.evaluate("el => getComputedStyle(el, '::before').display") == "none"
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.reload(wait_until="networkidle")
    counters = page.locator(".vault-summary strong span[aria-hidden=true]")
    expect(counters.first).to_have_text(str(page.get_by_role("article").count()))
    assert page.locator(".vault-summary strong").first.evaluate("el => getComputedStyle(el).fontSize") == counters.first.evaluate("el => getComputedStyle(el).fontSize")
    page.screenshot(path=str(OUTPUT / "desktop.png"), full_page=True, animations="disabled")

    page.goto(f"{BASE}/auth/reset-password")
    page.get_by_label("New password", exact=True).fill("demo-new-password-123")
    page.get_by_label("Confirm password", exact=True).fill("demo-mismatch-123")
    page.get_by_role("button", name="Update password", exact=True).click()
    expect(page.get_by_role("alert").filter(has_text="Passwords do not match.")).to_be_visible()
    page.get_by_label("Confirm password", exact=True).fill("demo-new-password-123")
    page.get_by_role("button", name="Update password", exact=True).click()
    page.wait_for_url(re.compile(r"/\?password=updated$"))
    assert not errors, errors
    print(f"Browser smoke passed. Screenshots: {OUTPUT}")
    browser.close()
