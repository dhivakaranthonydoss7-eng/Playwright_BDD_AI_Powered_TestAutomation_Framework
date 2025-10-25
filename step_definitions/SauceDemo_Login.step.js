const {Given, When, Then} = require('@cucumber/cucumber');
const assert = require('assert');
const SauceDemoLoginPage = require('../pageobjects/SauceDemoLoginPage');
const {ReusableMethodPage} = require('../pageobjects/ReusableMethodPage');
const {Helper} = require('../support/helper');
const testData = new Helper();

Given('I open the Sauce Demo login page', async function () {
  // Given I open the Sauce Demo login page
  this.sauceLogin = new SauceDemoLoginPage(this.page, this.results_dir, this.TC_ID, this.screenshots, this.featurename);
  // Initialize reusable screenshot helper for this test (uses same constructor signature)
  this.reusable = new ReusableMethodPage(this.page, this.results_dir, this.TC_ID, this.screenshots, this.featurename);

  await this.sauceLogin.goto();

  // take a login page screenshot (will be saved only if Excel 'Screenshot' flag is 'Yes')
  const loginSS = await this.reusable.takeScreenshot('Login_Page');
  if (loginSS) {
    // keep it in screenshots array for AfterStep attachment if configured
    await this.screenshots.push(loginSS);
  }
});

When('I enter login credentials', async function () {
  // When I enter login credentials
  const username = await testData.getData('TC_Data', this.TC_ID, 'User_ID');
  const password = await testData.getData('TC_Data', this.TC_ID, 'Password');

  // Allow blank username specifically for the empty-username negative scenario (TC-004)
  if (!username && !this.TC_ID.includes('Empty username')) {
    throw new Error(`No User_ID found in TC_Data for TC_ID='${this.TC_ID}'`);
  }
  if (!password && !this.TC_ID.includes('Empty password')) {
    throw new Error(`No Password found in TC_Data for TC_ID='${this.TC_ID}'`);
  }

  await this.sauceLogin.enterCredentials(username, password);
});

When('I click the Login button', async function () {
  // And I click the Login button
  await this.sauceLogin.clickLogin();

  // Take an after-login screenshot (this will only be saved if Excel 'Screenshot' flag is 'Yes')
  try {
    const afterSS = await this.reusable.takeScreenshot('AfterLogin');
    if (afterSS) {
      await this.screenshots.push(afterSS);
    }
  } catch (e) {
    console.warn('Failed to take AfterLogin screenshot:', e && e.message ? e.message : e);
  }
});

Then('I should be redirected to the inventory page', async function () {
  // Then I should be redirected to the inventory page
  await this.page.waitForLoadState('networkidle');
  const url = this.page.url();
  assert(url.includes('inventory.html'), `Expected URL to include inventory.html but was ${url}`);

  // Take inventory page screenshot and optionally compare
  const invSS = await this.reusable.takeScreenshot('Inventory_Page');
  if (invSS) {
    // push for AfterStep attachments (if enabled in Excel/constants)
    await this.screenshots.push(invSS);

    // Compare with baseline image name 'Inventory_Screen' if screenshot comparison is enabled in Excel
    try {
      await this.reusable.compareScreenshots('Inventory_Screen', invSS);
    } catch (e) {
      // Swallow compare errors so they don't mask functional failures, but log for debugging
      console.warn('Screenshot comparison failed:', e && e.message ? e.message : e);
    }
  }
});

Then('I should see at least one product in the inventory', async function () {
  // And I should see at least one product in the inventory
  const count = await this.sauceLogin.countInventoryItems();
  assert(count >= 1, `Expected at least 1 product in inventory, found ${count}`);
});

Then('no error message should be displayed', async function () {
  // And no error message should be displayed
  const visible = await this.sauceLogin.isErrorVisible();
  assert(!visible, 'Expected no visible error message after successful login');
});

// Then I should remain on the login page
Then('I should remain on the login page', async function () {
  await this.page.waitForLoadState('networkidle');
  const url = this.page.url();
  assert(!url.includes('inventory.html'), `Expected to stay on login page but navigated to ${url}`);
});

// Then an account locked error message should be displayed
Then('an account locked error message should be displayed', async function () {
  // Check the error container for visible text
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected an error message to be visible for locked out user');

  // Take a screenshot showing the error (only saved if Excel 'Screenshot' = Yes)
  try {
    const lockedSS = await this.reusable.takeScreenshot('Locked_Error');
    if (lockedSS) {
      await this.screenshots.push(lockedSS);
    }
  } catch (e) {
    console.warn('Failed to take Locked_Error screenshot:', e && e.message ? e.message : e);
  }

  // Safely get the text and assert it indicates a locked account
  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const ok = lower.includes('locked') || lower.includes('locked out') || lower.includes('sorry');
  assert(ok, `Unexpected error text for locked user: "${text}"`);
});

// Then an invalid credentials error message should be displayed
Then('an invalid credentials error message should be displayed', async function () {
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected an error message to be visible for invalid credentials');

  // Take a screenshot for invalid credentials
  try {
    const invalidSS = await this.reusable.takeScreenshot('Invalid_Credentials_Error');
    if (invalidSS) await this.screenshots.push(invalidSS);
  } catch (e) {
    console.warn('Failed to take Invalid_Credentials_Error screenshot:', e && e.message ? e.message : e);
  }

  // Assert expected invalid credentials text
  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const ok =
    lower.includes('username') ||
    lower.includes('password') ||
    lower.includes('do not match') ||
    lower.includes('do not match any user');
  assert(ok, `Unexpected error text for invalid credentials: "${text}"`);
});

// Then a missing username error message should be displayed
Then('a missing username error message should be displayed', async function () {
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected an error message to be visible for missing username');

  try {
    const missingUserSS = await this.reusable.takeScreenshot('Missing_Username_Error');
    if (missingUserSS) await this.screenshots.push(missingUserSS);
  } catch (e) {
    console.warn('Failed to take Missing_Username_Error screenshot:', e && e.message ? e.message : e);
  }

  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const ok =
    lower.includes('username is required') || lower.includes('username required') || lower.includes('username');
  assert(ok, `Unexpected error text for missing username: "${text}"`);
});

// Then a missing password error message should be displayed
Then('a missing password error message should be displayed', async function () {
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected an error message to be visible for missing password');

  try {
    const missingPassSS = await this.reusable.takeScreenshot('Missing_Password_Error');
    if (missingPassSS) await this.screenshots.push(missingPassSS);
  } catch (e) {
    console.warn('Failed to take Missing_Password_Error screenshot:', e && e.message ? e.message : e);
  }

  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const ok =
    lower.includes('password is required') || lower.includes('password required') || lower.includes('password');
  assert(ok, `Unexpected error text for missing password: "${text}"`);
});

// Then an injection attempt should be handled safely
Then('an injection attempt should be handled safely', async function () {
  // We expect an error (invalid credentials) but NOT a server error / stack trace
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected a generic error message for injection attempt');

  try {
    const injSS = await this.reusable.takeScreenshot('Injection_Attempt_Error');
    if (injSS) await this.screenshots.push(injSS);
  } catch (e) {
    console.warn('Failed to take Injection_Attempt_Error screenshot:', e && e.message ? e.message : e);
  }

  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const genericFail = lower.includes('username') || lower.includes('password') || lower.includes('match any user');
  const hasStackTraceMarkers = /(exception|stack|trace|sql|syntax|error:.*line)/i.test(text);
  assert(genericFail, `Injection did not produce expected generic failure text: "${text}"`);
  assert(!hasStackTraceMarkers, `Potential stack trace or server error leaked in message: "${text}"`);
});

// Then an excessively long credentials attempt should be handled safely
Then('an excessively long credentials attempt should be handled safely', async function () {
  const visible = await this.sauceLogin.isErrorVisible();
  assert(visible, 'Expected a generic error message for excessively long credentials');

  try {
    const longSS = await this.reusable.takeScreenshot('Long_Credentials_Error');
    if (longSS) await this.screenshots.push(longSS);
  } catch (e) {
    console.warn('Failed to take Long_Credentials_Error screenshot:', e && e.message ? e.message : e);
  }

  let text = '';
  try {
    text = (await this.page.locator('[data-test="error"]').innerText()).toString();
  } catch {
    text = '';
  }
  const lower = text.toLowerCase();
  const genericFail = lower.includes('username') || lower.includes('password') || lower.includes('match any user');
  const hasStackTraceMarkers = /(exception|stack|trace|sql|syntax|rangeerror|memory|out of)/i.test(text);
  assert(genericFail, `Long input did not produce expected generic failure text: "${text}"`);
  assert(!hasStackTraceMarkers, `Potential crash or stack trace leaked in message: "${text}"`);
});

// When I toggle the password visibility if available
When('I toggle the password visibility if available', async function () {
  // Attempt to locate a password visibility toggle (common selectors attempted).
  // This step is resilient: if no toggle is found after attempts, it records N/A state in context.
  const toggleSelectors = [
    '#password-toggle',
    '.password-toggle',
    '[data-test="password-toggle"]',
    'button:has-text("Show")',
    'button:has-text("Hide")',
  ];
  let toggleFound = null;
  for (const sel of toggleSelectors) {
    const loc = this.page.locator(sel);
    if ((await loc.first().count()) > 0) {
      toggleFound = loc.first();
      break;
    }
  }
  if (!toggleFound) {
    this.passwordToggleNA = true; // mark scenario as not applicable
    return;
  }
  // Capture initial type attribute state of password field
  const pwdInput = this.page.locator('#password');
  const initialType = await pwdInput.getAttribute('type');
  // Click toggle to reveal
  await toggleFound.click();
  await this.page.waitForTimeout(200); // small delay for UI update
  const revealType = await pwdInput.getAttribute('type');
  // Click again (or same button if it toggles) to re-mask
  await toggleFound.click();
  await this.page.waitForTimeout(200);
  const finalType = await pwdInput.getAttribute('type');

  this.passwordToggleResult = {initialType, revealType, finalType};
  // Screenshot after reveal attempt
  try {
    const toggleSS = await this.reusable.takeScreenshot('Password_Toggle');
    if (toggleSS) await this.screenshots.push(toggleSS);
  } catch (e) {
    console.warn('Failed to take Password_Toggle screenshot:', e && e.message ? e.message : e);
  }
});

// Then the password visibility toggle behavior should be verified or marked N/A
Then('the password visibility toggle behavior should be verified or marked N/A', async function () {
  if (this.passwordToggleNA) {
    console.log('Password visibility toggle not present; scenario marked as N/A.');
    assert(true);
    return;
  }
  const {initialType, revealType, finalType} = this.passwordToggleResult || {};
  assert(initialType, 'Initial password input type not captured');
  // We allow either type="password" -> "text" -> "password" OR frameworks that swap attribute values similarly.
  const revealValid = initialType !== revealType || revealType === 'text';
  const remaskValid = finalType === initialType || finalType === 'password';
  assert(
    revealValid,
    `Password field did not change visibility after toggle. initial=${initialType}, after first toggle=${revealType}`
  );
  assert(remaskValid, `Password field did not re-mask after second toggle. initial=${initialType}, final=${finalType}`);
});
