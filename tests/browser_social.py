"""Provider-readiness UI check; makes no requests to external identity providers."""
import os
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("KEEP_TEST_URL", "http://127.0.0.1:3000")
OUTPUT = Path(tempfile.gettempdir()) / "keep-social"
OUTPUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(reduced_motion="reduce")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    for route in ["/login", "/signup"]:
        page.goto(BASE + route)
        page.wait_for_load_state("networkidle")
        for provider in ["Google", "GitHub"]:
            button = page.get_by_role("button", name=f"Continue with {provider}", exact=True)
            expect(button).to_be_visible()
            expect(button).to_be_disabled()
            assert button.locator("svg").count() == 1
            assert button.get_attribute("aria-describedby")
        assert page.get_by_role("button", name="Continue with Apple", exact=True).count() == 0
        expect(page.get_by_text("Social sign-in isn’t available yet. Continue with email.", exact=True)).to_be_visible()
        for width in [1440, 768, 390, 320]:
            page.set_viewport_size({"width": width, "height": 1000})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (route, width)
        page.screenshot(path=str(OUTPUT / (route[1:] + "-mobile.png")), full_page=True)
    page.goto(BASE + "/auth/callback?error=access_denied")
    expect(page.get_by_role("alert").filter(has_text="Sign-in was canceled")).to_be_visible()
    expect(page.get_by_role("button", name="Log in", exact=True)).to_be_enabled()
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(BASE + "/login")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(OUTPUT / "login-desktop.png"), full_page=True)
    assert not errors, errors
    browser.close()
print("PASS: Google/GitHub on login and signup; Apple removed; honest unavailable states; mobile layout; OAuth cancellation and email fallback")
