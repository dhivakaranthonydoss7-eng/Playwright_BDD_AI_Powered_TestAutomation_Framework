This repository is a Playwright + Cucumber (BDD) test framework with custom runner logic, Excel-driven test data, screenshot comparison, and Allure reporting. Use these concise, actionable rules to be immediately productive.

- Big picture
  - Feature files live under `features/*.feature` and are executed by cucumber-js. Step implementations are in `step_definitions/*.step.js` and rely on `support/hooks.js` to provide the Playwright `this.page` context.
  - `support/hooks.js` launches Playwright (via `@playwright/test`'s chromium) and constructs `this.page`, `this.context`, `this.browser`, and helper objects. Do not re-create the browser lifecycle in steps; reuse `this.page`.
  - Test selection is controlled by `RunManager.xlsx` (sheet `Regression`) and `support/runner.js` which updates `cucumber.json`. The runmanager expects the feature path in column 3 (e.g. `features/SauceDemo.feature:4`).

- Developer workflows (how to run tests)
  - Generate the cucumber paths from the Excel RunManager: `node runmanager.js` (this calls `support/runner.js`).
  - Standard execution command (always use this): `npm run test`. This script runs the RunManager sync, executes cucumber-js, and then serves the Allure report.
  - Alternative (direct-only) command for quick local debugging (skips automatic allure serve & pre-run sync): `npm run app` or `npx cucumber-js`. Prefer `npm run test` for CI, reporting, and routine runs.
  - Allure results are written to `./allure-results/${allure}` where `${allure}` comes from `datatables/json/constants.json`.

- Key project conventions and patterns
  - Data-driven tests: test-level inputs come from Excel `datatables/excel/data.xlsx`. The helper at `support/helper.js` reads sheet `TC_Data` (or `Security_Patch`) rows where column 2 contains the `TC_ID` (scenario name). Maintain TC_ID (scenario name) in the feature and Excel to map data.
  - TC_ID must EXACTLY match the full Scenario line (including descriptive suffix) for reliable data mapping. For example:
    Scenario: TC-003 - Negative - Invalid credentials
    Then in `TC_Data` (column 2) and any RunManager TestCase/TC_ID column use the identical string:
    "TC-003 - Negative - Invalid credentials" (not just "TC-003"). This ensures `Helper.getData()` finds the correct row.
  - RunManager path format: features are referenced with a line number suffix: `features/<file>.feature:<line>`; `support/helper.js` reads column 3 for the path when building `cucumber.json`.
  - Page object constructors commonly use this signature: `new PageObject(this.page, this.results_dir, this.TC_ID, this.screenshots, this.featurename)`. Maintain that order when creating objects in step defs.
  - Screenshot flow: use `ReusableMethodPage.takeScreenshot()` and `compareScreenshots()`; screenshots are attached in `AfterStep` hook only if `datatables/json/constants.json` and Excel flags enable them.
  - Self-healing selectors: `selectors.json` maps logical keys to locator strings. `pageobjects/selfHealing.js` provides helpers like `selfHealingClick(this.page, 'loginButton', 'ログイン')` — prefer logical keys over hard-coded XPaths.

- Integrations & environment toggles
  - Execution platform and URLs are configured in `datatables/json/constants.json` (`execution_platform`, `test_1`..`test_5`, `pre_prod`). Hooks read these to decide browser/context/proxy behavior.
  - For LOCAL runs hooks launch Edge (`channel: 'msedge'`) with `headless: false` by default; for SBOX/LAB they connect to a wss endpoint and set proxy settings.
  - Set `RECORD_VIDEO=true` env to enable video recording (`support/hooks.js` reads this env variable when creating context).

- How to add a new scenario (step-by-step)
  1. Create `features/my_feature.feature` with a Scenario and tag the scenario name to match the `TC_ID` you’ll use in Excel.
  2. Implement BDD steps in `step_definitions/my_feature.step.js`. Use `this.page` and construct page objects via the standard constructor signature.
  3. Add test data and flags into `datatables/excel/data.xlsx` under sheet `TC_Data` with the same `TC_ID` in column 2.
  4. Add the feature path into `RunManager.xlsx` sheet `Regression` with `Execute` = `Yes` and `Path` = `features/my_feature.feature:<line>` (line number points to the scenario or tag). Run `node runmanager.js` to update `cucumber.json`.

- Files to inspect when debugging
  - Browser lifecycle and test wiring: `support/hooks.js`
  - RunManager and cucumber.json generator: `support/runner.js`, `runmanager.js`, `cucumber.json`
  - Excel data access: `support/helper.js` and `datatables/excel/data.xlsx`
  - Reusable helpers and screenshot logic: `pageobjects/ReusableMethodPage.js`
  - Self-healing and selectors mapping: `pageobjects/selfHealing.js`, `selectors.json`
  - Reporter integration: `utils/reporter.js` and `datatables/json/constants.json` (controls allure folder)

- Small examples (copy/paste)
  - RunManager path example placed in Excel column 3: `features/SauceDemo.feature:4`
  - Page object usage in step file:
    const login = new LoginPage(this.page, this.results_dir, this.TC_ID, this.screenshots, this.featurename);
    await login.enterUserID(await testData.getData('TC_Data', this.TC_ID, 'User_ID'));

- Test data parameterization:
  - All per-test inputs must come from `datatables/excel/data.xlsx` sheet `TC_Data`.
  - Use the project's Helper API:
    const { Helper } = require('../support/helper');
    const testData = new Helper();
    const username = await testData.getData('TC_Data', this.TC_ID, 'User_ID');
    const password = await testData.getData('TC_Data', this.TC_ID, 'Password');
  - Keep header names in Excel row 2 exactly (e.g., 'User_ID', 'Password').
  - The Scenario name in the feature file must match the `TC_ID` in column 2 of `TC_Data` rows (helper looks for TC_ID in col 2).

- RunManager update:
  - Add feature path (format `features/File.feature:<line>`) in column 3 and set 'Execute'='Yes' in the row.
  - You can append an entry programmatically using `scripts/add_runmanager_entry.js`.
  - After RunManager update, just run the unified command:
    npm run test

- Screenshot configuration and usage (enable screenshots for all tests)
  - Purpose: capture UI state for debugging and visual regression. Screenshots are controlled by flags in `datatables/excel/data.xlsx` (sheet `TC_Data`) and are attached in `AfterStep` if enabled.
  - Excel flags (add these headers to row 2 of `TC_Data` if they don't exist):
    - `Screenshot` (Yes/No) — whether to capture step screenshots for the TC_ID row.
    - `Screenshot_Comparison` (Yes/No) — whether to run image comparison against a baseline image.
  - To enable screenshots for all tests, set `Screenshot` = `Yes` for every TC row in `TC_Data`. Optionally set `Screenshot_Comparison` = `Yes` to enable pixel-compare.
  - How screenshots are taken in code:
    - Use the `ReusableMethodPage` helper in steps:
      const {ReusableMethodPage} = require('../pageobjects/ReusableMethodPage');
      this.reusable = new ReusableMethodPage(this.page, this.results_dir, this.TC_ID, this.screenshots, this.featurename);
      const ss = await this.reusable.takeScreenshot('Step_Name');
      if (ss) await this.screenshots.push(ss);
    - To compare the captured screenshot to a baseline image (if `Screenshot_Comparison` = Yes):
      await this.reusable.compareScreenshots('Baseline_Image_Name', ss);
  - File locations and naming:
    - Screenshots are saved under the test results folder defined by hooks: `./test-results/screenshots/${TC_ID}_${datetime}/${TC_ID}_${Step_Name}.png`.
    - Baseline images are read/written under `./test-results/${TC_ID}` by the compare utility; see `utils/compareImages.js` for details.
  - Best practices:
    - Keep `Screenshot`=Yes for CI runs only when you need artifacts, or enable selectively to reduce storage.
    - Use `Screenshot_Comparison` sparingly: maintain baseline images intentionally and update them when UI changes are approved.
    - Prefer descriptive step names for screenshot file clarity (e.g., `Login_Page`, `Inventory_Page`).
If anything here is unclear or you want the file phrased differently (shorter, add more examples, or split into sections for different agent roles), tell me which parts to iterate on and I’ll update the file.
