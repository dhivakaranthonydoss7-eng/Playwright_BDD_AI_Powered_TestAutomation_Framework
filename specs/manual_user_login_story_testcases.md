# User Login - Manual Test Cases

## User Story
As a user, I want to log in to the application so that I can access my account.

## Acceptance Criteria (Mapped)
1. Valid credentials redirect to dashboard.
2. Incorrect password shows: "Invalid username or password." (or localized equivalent).
3. Unregistered user shows: "User does not exist." (or equivalent).
4. Successful valid login creates a session (verified via session cookie / token).

## Environment & Assumptions
- Supported Browsers: Latest Chrome / Edge / Firefox.
- Base URL: https://<your-app-domain>/ (login page at /login).
- Test Data: Registered user (e.g., username: `registered_user`, password: `ValidPass123!`).
  - Another registered user for negative password test to avoid lockout (`registered_user2`).
- Unregistered username: `ghost_user_xyz` (guaranteed not provisioned).
- Starting State: Fresh browser session (cookies & local storage cleared) before each test.
- Network stable, backend reachable.
- Session mechanism: Secure cookie named `session_id` OR local storage token `authToken` (adjust if actual implementation differs).

---
## Test Case Matrix Overview
| TC ID | Title | Type | Acceptance Criteria Ref |
|-------|-------|------|-------------------------|
| TC-LOGIN-001 | Valid login redirects to dashboard | Positive | AC1, AC4 |
| TC-LOGIN-002 | Invalid password error | Negative | AC2 |
| TC-LOGIN-003 | Unregistered user error | Negative | AC3 |
| TC-LOGIN-004 | Session cookie/token present after login | Positive | AC4 |
| TC-LOGIN-005 | Session not created on invalid password | Negative | AC2 |
| TC-LOGIN-006 | Session not created for unregistered user | Negative | AC3 |
| TC-LOGIN-007 | Case sensitivity on username (varied casing) | Robustness | Derived |
| TC-LOGIN-008 | Leading/trailing whitespace trimmed | Usability | Derived |
| TC-LOGIN-009 | Empty username validation | Negative | Derived |
| TC-LOGIN-010 | Empty password validation | Negative | Derived |
| TC-LOGIN-011 | Locked/disabled account message (if feature exists) | Negative | Derived |
| TC-LOGIN-012 | Multiple rapid failed attempts do not crash | Robustness | Derived |
| TC-LOGIN-013 | Browser back from dashboard does not expose login (session persists) | Session | Derived |
| TC-LOGIN-014 | Session persists after refresh (until logout) | Session | Derived |
| TC-LOGIN-015 | Logout clears session | Session | Derived |

---
### TC-LOGIN-001: Valid login redirects to dashboard
Steps:
1. Clear browser data and navigate to /login.
2. Enter Username: `registered_user`.
3. Enter Password: `ValidPass123!`.
4. Click Login.

Expected Results:
- Redirect to /dashboard (URL contains `/dashboard`).
- Dashboard primary element (e.g., header or user avatar) is visible.
- No error message displayed.

Success Criteria: Dashboard loads fully; session cookie/token created.
Failure Conditions: Stay on login page, error message, HTTP error.

---
### TC-LOGIN-002: Invalid password error
Steps:
1. Navigate to /login.
2. Enter Username: `registered_user2`.
3. Enter Password: `WrongPass!`.
4. Click Login.

Expected Results:
- Remains on /login.
- Error banner shows text containing "Invalid username or password".
- No session cookie/token created.

Success Criteria: Error shown; no navigation.
Failure Conditions: Dashboard loads or incorrect/no error.

---
### TC-LOGIN-003: Unregistered user error
Steps:
1. Navigate to /login.
2. Enter Username: `ghost_user_xyz`.
3. Enter Password: `AnyPass123!`.
4. Click Login.

Expected Results:
- Remains on /login.
- Error message shows text containing "User does not exist".
- No session created.

Success Criteria: Correct error text; no session cookie/token.
Failure Conditions: Any redirect or different message.

---
### TC-LOGIN-004: Session created after valid login
Prerequisite: User not logged in.
Steps:
1. Perform steps of TC-LOGIN-001.
2. Open browser dev tools -> Application/Storage.
3. Inspect cookies/local storage for `session_id` or `authToken`.

Expected Results:
- Secure session identifier present.
- Expiration (if set) is in the future.
- Token not null/empty.

Success Criteria: Session artifact exists and conforms to expected format.
Failure Conditions: Missing cookie/token or malformed value.

---
### TC-LOGIN-005: No session on invalid password
Steps:
1. Execute TC-LOGIN-002.
2. Inspect storage for session.

Expected Results:
- No session cookie/token present.

Success Criteria: Absence confirmed.
Failure Conditions: Session created despite failed login.

---
### TC-LOGIN-006: No session on unregistered user
Steps:
1. Execute TC-LOGIN-003.
2. Inspect storage for session.

Expected Results: No session cookie/token.
Success Criteria: Absence confirmed.
Failure Conditions: Unexpected session artifact present.

---
### TC-LOGIN-007: Username case sensitivity
Steps:
1. Navigate to /login.
2. Enter Username: `REGISTERED_USER` (uppercase variant of valid user).
3. Enter Password: `ValidPass123!`.
4. Click Login.

Expected Results:
- Depending on design: either successful login (case-insensitive) OR error (case-sensitive). Document actual behavior.

Success Criteria: Behavior consistent with documented requirements.
Failure Conditions: Inconsistent or intermittent outcomes.

---
### TC-LOGIN-008: Trim leading/trailing whitespace
Steps:
1. Navigate to /login.
2. Enter Username: ` registered_user ` (spaces around).
3. Enter Password: ` ValidPass123! `.
4. Click Login.

Expected Results:
- Whitespace trimmed; login succeeds.

Success Criteria: Dashboard loads; no error.
Failure Conditions: Failure due solely to whitespace (if requirements expect trimming).

---
### TC-LOGIN-009: Empty username validation
Steps:
1. Navigate to /login.
2. Leave Username blank.
3. Enter Password: `ValidPass123!`.
4. Click Login.

Expected Results:
- Validation error: "Username is required".

Success Criteria: Error displayed; no navigation.
Failure Conditions: Dashboard loads or generic error lacking specificity.

---
### TC-LOGIN-010: Empty password validation
Steps:
1. Navigate to /login.
2. Enter Username: `registered_user`.
3. Leave Password blank.
4. Click Login.

Expected Results:
- Validation error: "Password is required".

Success Criteria: Specific password required message.
Failure Conditions: Dashboard loads or no message.

---
### TC-LOGIN-011: Locked/Disabled account
Prerequisite: User `locked_user` flagged as locked.
Steps:
1. Navigate to /login.
2. Enter Username: `locked_user`.
3. Enter Password: `ValidPass123!`.
4. Click Login.

Expected Results:
- Error message indicating account locked (e.g., "Account locked. Contact support.").

Success Criteria: Specific locked messaging; no session.
Failure Conditions: Successful login or unrelated error.

---
### TC-LOGIN-012: Multiple rapid failed attempts stability
Steps:
1. Navigate to /login.
2. Loop 5 times: enter Username: `registered_user2`, Password: `WrongPass!`, click Login, dismiss error.

Expected Results:
- Consistent error each attempt.
- No application slowdown or crash.
- Optional: Lockout after threshold (if configured) documented.

Success Criteria: Stable responses; no performance degradation.
Failure Conditions: Browser hang, inconsistent messaging, security bypass.

---
### TC-LOGIN-013: Browser back after login
Steps:
1. Perform valid login (TC-LOGIN-001).
2. Click browser Back.

Expected Results:
- Either stays on dashboard OR returns to login but immediately redirects back due to active session.
- No ability to interact with stale login form (if shown briefly).

Success Criteria: Session continuity maintained.
Failure Conditions: Access to pre-auth state without logout.

---
### TC-LOGIN-014: Session persists after refresh
Steps:
1. Perform valid login.
2. Refresh browser (Ctrl+R / F5).

Expected Results:
- Remains logged in; dashboard still accessible.

Success Criteria: Session data persists; no forced logout.
Failure Conditions: Unintended logout.

---
### TC-LOGIN-015: Logout clears session
Steps:
1. Perform valid login.
2. Click Logout button.
3. Attempt to revisit /dashboard directly via URL.

Expected Results:
- Redirected to /login.
- Session cookie/token removed or invalidated.

Success Criteria: No access to protected pages after logout.
Failure Conditions: Protected content accessible.

---
## Test Data Summary
| Purpose | Username | Password | Notes |
|---------|----------|----------|-------|
| Valid login | registered_user | ValidPass123! | Active account |
| Alternate valid | registered_user2 | ValidPass123! | For invalid password attempts |
| Wrong password | registered_user2 | WrongPass! | Negative case |
| Unregistered | ghost_user_xyz | AnyPass123! | Must not exist |
| Locked | locked_user | ValidPass123! | Preconfigured locked status |

---
## Risks & Edge Considerations
- Brute force protection (not covered unless lockout implemented).
- Localization: Error message variants in other languages.
- Security headers (ensure session cookie is HttpOnly/Secure).
- Accessibility: Focus on first invalid field when validation fails.

## Completion Criteria
- All AC-related test cases executed & passed or defects logged.
- Session behavior validated (creation, persistence, logout).
- Negative paths confirm no unintended session creation.
- Documentation updated with any deviations or clarifications.

## Failure Logging Guidelines
For each failed test capture:
- Screenshot of state.
- Console logs (errors).
- Network log (auth request/response if accessible).
- Steps to reproduce + observed vs expected message.
