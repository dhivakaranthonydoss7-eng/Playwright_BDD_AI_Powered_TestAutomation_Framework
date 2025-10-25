/* eslint-disable no-unused-vars */
class SauceDemoLoginPage {
  constructor(page, results_dir, TC_ID, screenshots, featurename) {
    this.page = page;
    this.results_dir = results_dir;
    this.TC_ID = TC_ID;
    this.screenshots = screenshots;
    this.featurename = featurename;

    this.url = 'https://www.saucedemo.com/';
    this.username = this.page.locator('#user-name');
    this.password = this.page.locator('#password');
    this.loginBtn = this.page.locator('#login-button');
    this.inventoryItems = this.page.locator('.inventory_item');
    this.error = this.page.locator('[data-test="error"]');
    this.inventoryContainers = ['.inventory_list', '.inventory_container'];
  }

  async goto() {
    await this.page.goto(this.url, {waitUntil: 'networkidle'});
    await this.username.waitFor({state: 'visible', timeout: 10000});
  }

  async enterCredentials(user, pass) {
    await this.username.fill(user);
    await this.password.fill(pass);
  }

  async clickLogin() {
    // Click login and wait for either navigation to inventory, inventory items to appear, or an error message
    await this.loginBtn.click();
    try {
      await Promise.race([
        this.page.waitForNavigation({waitUntil: 'networkidle', timeout: 20000}),
        this.page.waitForSelector('.inventory_list', {timeout: 20000}),
        this.page.waitForSelector('[data-test="error"]', {timeout: 20000}),
        // Note: inventoryContainers additional checks handled below if needed
      ]);
    } catch (e) {
      // swallow timeout; the following checks/assertions will surface issues
    }
  }

  async countInventoryItems() {
    try {
      await this.inventoryItems.first().waitFor({state: 'visible', timeout: 5000});
    } catch (e) {
      // ignore
    }
    let count = await this.inventoryItems.count();
    if (count === 0) {
      // try alternative container selectors
      for (const sel of this.inventoryContainers) {
        try {
          const container = this.page.locator(sel);
          if ((await container.count()) > 0) {
            // count children with inventory_item class if present
            const items = container.locator('.inventory_item');
            const c = await items.count();
            if (c > 0) return c;
          }
        } catch (e) {
          // continue to next
        }
      }
    }
    return count;
  }

  async isErrorVisible() {
    try {
      return await this.error.isVisible();
    } catch (e) {
      return false;
    }
  }
}

module.exports = SauceDemoLoginPage;
