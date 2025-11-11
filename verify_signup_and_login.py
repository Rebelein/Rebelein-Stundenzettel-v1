import asyncio
from playwright.async_api import async_playwright
import sys
import random
import string

# Generate a random string for the email to ensure a new user every time
random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
email = f"testuser_{random_suffix}@example.com"
password = "password123"
full_name = "Test User"

async def main(url):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print(f"Navigating to {url}")
            await page.goto(url, timeout=60000)

            # --- Sign Up ---
            print("Looking for 'Sign Up' link to switch to registration form...")
            # The screenshot shows the default view is Login. We need to switch to Sign up.
            await page.get_by_role("button", name="Sign Up", exact=True).nth(1).click()

            print("Filling out sign up form...")
            await page.get_by_label("Full Name").fill(full_name)
            await page.get_by_label("Email").fill(email)
            await page.get_by_label("Password").fill(password)

            print("Clicking the main 'Sign Up' button to submit...")
            await page.get_by_role("button", name="Sign Up", exact=True).first.click()

            print("Waiting for registration to complete and UI to switch back to login...")
            # After successful signup, the form should switch back to login mode.
            # We will wait for the 'Login' button to be visible as a confirmation.
            await page.wait_for_selector('button:has-text("Sign In")', timeout=10000)
            print("Sign up successful, now on the login page.")

            # --- Sign In ---
            print("Filling out login form...")
            await page.get_by_label("Email").fill(email)
            await page.get_by_label("Password").fill(password)

            print("Clicking 'Sign In' button...")
            await page.get_by_role("button", name="Sign In").click()

            print("Waiting for main application page to load...")
            # Look for an element that only appears when logged in, e.g., the 'Logout' button.
            await page.wait_for_selector('button:has-text("Logout")', timeout=10000)

            print("Successfully logged in and verified the main app page.")
            screenshot_path = "/home/jules/verification/success.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
            print(f"USER_APPROVAL_REQUIRED_Verification_Successful_Screenshot_Path:{screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
            screenshot_path = "/home/jules/verification/error.png"
            await page.screenshot(path=screenshot_path)
            print(f"Error screenshot saved to {screenshot_path}", file=sys.stderr)
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python verify_script.py <url>", file=sys.stderr)
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
