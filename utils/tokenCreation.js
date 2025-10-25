const {expect} = require('@playwright/test');

/**
 *  Get the token from microsoft graph application
 */
async function getToken(page) {
  await page.waitForLoadState();
  //***** Assert profile is enabled with loggged user. if not, adding wait time to enable *****
  try {
    await expect(page.getByLabel('profile', {exact: true})).toBeVisible();
  } catch (error) {
    await page.waitForTimeout(10000);
    console.log(error);
    await expect(page.getByLabel('profile', {exact: true})).toBeVisible();
  }

  //***** Click on run button and assert the response *****
  await page.getByRole('button', {name: 'Run query'}).click();
  await expect(page.locator("//span[text() = '200']")).toBeVisible();

  //***** Click on access token and accept the dialog box *****
  await page.getByLabel('Access token').click();
  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.accept();
  });

  //***** Copy the token and return *****
  await page.getByLabel('Copy').click();
  let token = await page.locator("label[id = 'access-tokens-tab']").textContent();
  return token;
}

module.exports = {getToken};
