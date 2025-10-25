# SauceDemo Login - Manual Test Cases

## Executive Summary
This document contains manual test cases for the login functionality of Sauce Demo (https://www.saucedemo.com/). Each test case is written to be followed by a tester manually and includes clear steps, expected results, assumptions about the starting state (always a fresh browser session with cleared cookies/local storage), success criteria, and failure conditions.

## Environment & Assumptions
- Browser: Latest Chrome/Edge/Firefox
- Network: Internet access
- Starting state: No cached session or authentication; browser data cleared
- Test account credentials available for positive scenarios
- Base URL: https://www.saucedemo.com/

---

## Test Cases

### TC-001: Positive - Standard user login (happy path)
1. Open browser and navigate to https://www.saucedemo.com/
2. In the Username field, enter: `standard_user`
3. In the Password field, enter: `secret_sauce`
4. Click the `Login` button

Expected Results:
- User is redirected to the inventory page (URL contains `inventory.html`).
- Inventory list is visible and contains at least one product.
- No error messages are displayed.

Assumptions:
- `standard_user` account exists and is active.

Success Criteria:
- The page navigates to inventory and shows product list.

Failure Conditions:
- Remains on login page or displays an error message.

---

### TC-002: Negative - Locked out user
1. Navigate to https://www.saucedemo.com/
2. Enter Username: `locked_out_user`
3. Enter Password: `secret_sauce`
4. Click `Login`

Expected Results:
- Login fails and an error message appears: "Sorry, this user has been locked out." (or similar)
- User remains on the login page.

Assumptions:
- `locked_out_user` is configured as locked in the test environment.

Success Criteria:
- Appropriate locked-out error message is shown.

Failure Conditions:
- User is logged in or a different/unclear error is shown.

---

### TC-003: Negative - Invalid credentials
1. Navigate to the login page
2. Enter Username: `invalid_user`
3. Enter Password: `bad_password`
4. Click `Login`

Expected Results:
- Login fails and an error message appears: "Username and password do not match any user in this service." (or similar)
- User stays on the login page.

Assumptions:
- The credentials used are not valid users.

Success Criteria:
- Correct invalid credentials error message is displayed.

Failure Conditions:
- Unexpected behavior such as redirection to inventory or no error shown.

---

### TC-004: Negative - Empty username
1. Navigate to the login page
2. Leave Username field blank
3. Enter Password: `secret_sauce`
4. Click `Login`

Expected Results:
- Login fails and an error message appears: "Username is required" (or similar)
- User remains on the login page.

Assumptions:
- The application validates username presence.

Success Criteria:
- Validation message for missing username appears.

Failure Conditions:
- Login succeeds or no validation message.

---

### TC-005: Negative - Empty password
1. Navigate to the login page
2. Enter Username: `standard_user`
3. Leave Password field blank
4. Click `Login`

Expected Results:
- Login fails and an error message appears: "Password is required" (or similar)
- User remains on the login page.

Assumptions:
- The application validates password presence.

Success Criteria:
- Validation message for missing password appears.

Failure Conditions:
- Login succeeds or no validation message.

---

### TC-006: Edge - SQL/Script injection attempt in username
1. Navigate to the login page
2. Enter Username: `'; DROP TABLE users; --`
3. Enter Password: `secret_sauce`
4. Click `Login`

Expected Results:
- Login fails with standard invalid credentials message or input is safely sanitized.
- No server errors or stack traces are shown.
- Application remains stable.

Assumptions:
- App has input sanitization and backend protections.

Success Criteria:
- No data loss, no server errors, and proper error message shown.

Failure Conditions:
- Server error displayed or application becomes unresponsive.

---

### TC-007: Edge - Excessively long username/password
1. Navigate to the login page
2. Enter Username: a string of 5000 `a` characters
3. Enter Password: a string of 5000 `a` characters
4. Click `Login`

Expected Results:
- Login fails gracefully (invalid credentials or validation message).
- No client or server crashes.
- Inputs may be truncated by the UI; ensure clear error message.

Assumptions:
- UI enforces reasonable input length or backend defends against overly long inputs.

Success Criteria:
- Application handles input without crashing and shows meaningful error.

Failure Conditions:
- Crash, unhandled exception, or server error page.

---

### TC-008: Usability - Show/hide password toggle (if present)
1. Navigate to the login page
2. Enter Password: `secret_sauce`
3. If a password visibility toggle exists, click it to reveal the password

Expected Results:
- Password text becomes visible when toggle activated and masked when deactivated.

Assumptions:
- The UI may or may not include this control.

Success Criteria:
- Toggle works as expected when present.

Failure Conditions:
- Toggle not present (mark as N/A) or does not reveal/mask password correctly.

---

## Test Data
- Positive: `standard_user` / `secret_sauce`
- Locked: `locked_out_user` / `secret_sauce`
- Invalid: any random credentials

## Notes for Testers
- Clear browser cookies/local storage between test runs to ensure consistent results.
- If messages differ slightly, verify intent (authentication failure vs. server error) and update expected text.

## Completion Criteria
- All positive and negative test cases executed and results recorded.
- Any defects raised have reproduction steps and screenshots attached.

