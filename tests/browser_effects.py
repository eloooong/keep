"""Exercise the account-access effects against an explicitly enabled demo."""
import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("KEEP_TEST_URL", "http://localhost:3000")
assert os.environ.get("KEEP_TEST_DEMO_MODE") == "true", "Explicit demo-test opt-in required"
OUTPUT = Path(tempfile.gettempdir()) / "keep-react-bits"
OUTPUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        "--enable-webgl", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    ])
    try:
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")
        assert page.locator(".demo-notice").count() == 0
        shader = page.locator(".threads-container")
        expect(shader).to_have_attribute("data-ready", "true")
        expect(shader).to_have_attribute("data-running", "true")
        expect(page.locator(".decrypted-text")).to_have_attribute("data-scrambling", "false")
        page.wait_for_function("Array.from(document.querySelectorAll('.decrypt-glyph')).map(el => el.textContent).join('') === 'A little order.'")
        page.mouse.move(330, 650)
        page.screenshot(path=str(OUTPUT / "login-desktop.png"), full_page=True)

        assert page.get_by_role("button", name="Pause effects", exact=True).count() == 0
        assert page.get_by_role("button", name="Resume effects", exact=True).count() == 0

        # Preference changes take effect without refreshing or clearing inputs.
        page.get_by_label("Email", exact=True).fill("demo@keep.app")
        page.emulate_media(reduced_motion="reduce")
        expect(shader).to_have_attribute("data-running", "false")
        expect(page.locator(".star-border")).to_have_attribute("data-paused", "true")
        expect(page.locator(".spotlight-light")).to_have_css("opacity", "0")
        expect(page.get_by_label("Email", exact=True)).to_have_value("demo@keep.app")
        assert page.locator(".star-border-top").evaluate("el => getComputedStyle(el).animationName") == "none"
        canvas = shader.locator("canvas")
        first = canvas.screenshot()
        page.wait_for_timeout(250)
        assert first == canvas.screenshot(), "Reduced-motion shader changed"
        page.emulate_media(reduced_motion="no-preference")
        expect(shader).to_have_attribute("data-running", "true")

        for width in [1440, 1024, 768, 390, 320]:
            page.set_viewport_size({"width": width, "height": 844})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"overflow at {width}"
        page.set_viewport_size({"width": 390, "height": 844})
        page.screenshot(path=str(OUTPUT / "login-mobile.png"), full_page=True)
        page.set_viewport_size({"width": 390, "height": 400})
        page.locator(".auth-content").scroll_into_view_if_needed()
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        expect(shader).to_have_attribute("data-running", "false")

        # Navigate away and back to exercise cleanup and a fresh canvas mount.
        for _ in range(2):
            page.get_by_role("link", name="Sign up", exact=True).click()
            expect(page.get_by_role("heading", name="Make room for your keys.")).to_be_visible()
            assert page.locator(".threads-container canvas").count() == 1
            page.get_by_role("link", name="Log in", exact=True).click()
            expect(page.get_by_role("heading", name="Welcome back.")).to_be_visible()
            assert page.locator(".threads-container canvas").count() == 1
        assert not errors, errors
        context.close()

        # With WebGL unavailable the illustration falls back and the form works.
        fallback = browser.new_context(viewport={"width": 1440, "height": 1000})
        fallback.add_init_script("""const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, ...args) {
                return String(type).includes('webgl') ? null : original.call(this, type, ...args);
            };""")
        static = fallback.new_page()
        static.on("pageerror", lambda error: errors.append(str(error)))
        static.goto(f"{BASE}/login")
        static.wait_for_load_state("networkidle")
        expect(static.locator(".threads-fallback")).to_be_visible()
        expect(static.get_by_label("Email", exact=True)).to_be_editable()
        static.screenshot(path=str(OUTPUT / "login-fallback.png"), full_page=True, animations="disabled")
        assert not errors, errors
        fallback.close()

        # HTML remains readable when JavaScript does not run.
        no_js = browser.new_context(java_script_enabled=False)
        static = no_js.new_page()
        static.goto(f"{BASE}/login")
        expect(static.get_by_role("heading", name="Welcome back.")).to_be_visible()
        expect(static.get_by_label("Email", exact=True)).to_be_visible()
        expect(static.locator(".threads-fallback")).to_be_visible()
        no_js.close()
        print(f"React Bits browser checks passed. Screenshots: {OUTPUT}")
    finally:
        browser.close()
