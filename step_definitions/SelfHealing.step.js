const {Given, Then, setDefaultTimeout} = require('@cucumber/cucumber');
const {selfHealingClick} = require('../pageobjects/selfHealing');

setDefaultTimeout(600000);

Given('User can open SauceDemo', async function () {
  await this.page.goto('https://www.saucedemo.com/');
  await this.page.locator('[data-test="username"]').click();
  await this.page.locator('[data-test="username"]').fill('standard_user');
  await this.page.locator('[data-test="password"]').click();
  await this.page.locator('[data-test="password"]').fill('secret_sauce');
  await this.page.waitForTimeout(3000);
  await this.page.locator('[data-test="login-button"]').click();
});

Then('User added a product and navigated to cart', async function () {
  await this.page.waitForTimeout(5000);
  await selfHealingClick(this.page, 'addBackPack', 'Sauce Labs Backpack');
  await this.page.waitForTimeout(3000);
  await this.page.locator('[data-test="shopping-cart-link"]').click();
  await this.page.waitForTimeout(3000);
});
