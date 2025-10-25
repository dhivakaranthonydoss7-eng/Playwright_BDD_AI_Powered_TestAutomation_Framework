/* eslint-disable no-undef */
const dataSet = JSON.parse(JSON.stringify(require('../datatables/json/constants.json')));
const os = require('os');
let screenshot = '';
const decryptModule = require('../DecryptLOCAL.js');
const decryptModuleSBOX = require('../DecryptSBOX.js');
const {Helper} = require('../support/helper');
const testData = new Helper();
let usernameforlogin, baseimg_path, diff;
const {compareImages} = require('../utils/compareImages');
const compare = new compareImages();
const {OpenAI} = require('openai');
class ReusableMethodPage {
  constructor(page, results_dir, TC_ID, screenshots, featurename) {
    this.results_dir = results_dir;
    this.TC_ID = TC_ID;
    this.page = page;
    this.screenshots = screenshots;
    this.featurename = featurename;

    //OneAccount Login
    this.oneAccountEmailField = this.page.locator("[id='identifierInput']");
    this.oneAccountNextButton = this.page.locator('(//button)[1]');
    this.oneAccountPasswordField = this.page.locator("[id = 'password']");
    this.OneAccount = this.page.getByLabel('あなたの会社のメールアドレス');
    this.OneAccountSubmit = this.page.getByRole('button', {name: 'ログイン'});
    this.OneAccountPwd = this.page.locator("[id='password");
    this.OneAccountPwdSubmit = this.page.getByRole('button');

    //LogoutUser
    this.logoutBtnHPM = this.page.getByLabel('ログアウト');
  }

  //Screenshot Method
  async takeScreenshot(screenName) {
    let sheetname;
    if (this.featurename == 'SecurityPatch') {
      sheetname = 'Security_Patch';
    } else {
      sheetname = 'TC_Data';
    }
    if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'No') {
      console.log('Screenshot Parameter is set to NO');
    } else if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'Yes') {
      console.log(`Screenshot is taken`);
      screenshot = await this.page.screenshot({
        path: `${this.results_dir}/${this.TC_ID}_${screenName}.png`,
        type: 'png',
      });
      return screenshot;
    }
  }

  async takeScreenshot_newWindow(page, screenName) {
    let sheetname;
    if (this.featurename == 'SecurityPatch') {
      sheetname = 'Security_Patch';
    } else {
      sheetname = 'TC_Data';
    }
    if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'No') {
      console.log('Screenshot Parameter is set to NO');
    } else if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'Yes') {
      console.log(`Screenshot is taken`);
      screenshot = await page.screenshot({
        path: `${this.results_dir}/${this.TC_ID}_${screenName}.png`,
        type: 'png',
      });
      return screenshot;
    }
  }

  async compareScreenshots(baseline_Img, actual_Img) {
    let sheetname;
    if (this.featurename === 'SecurityPatch') {
      sheetname = 'Security_Patch';
    } else {
      sheetname = 'TC_Data';
    }
    if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot_Comparison')) == 'No') {
      console.log('ScreenshotComparison Parameter is set to NO');
    } else if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot_Comparison')) == 'Yes') {
      baseimg_path = compare.getImagePath(`./test-results/${this.TC_ID}`, `${this.TC_ID}_${baseline_Img}`);
      diff = await compare.compareToBaseImage(baseimg_path, actual_Img, {threshold: 0.0});
      if (diff == 0) {
        await this.screenshots.push(`Screenshots Match ${baseimg_path}`);
      } else if (diff == 'No Screenshot') {
        await this.screenshots.push(
          `The base Image doesn't exist, a screenshot was taken to ${baseimg_path} so it can be used for next run`
        );
      } else {
        await this.screenshots.push(`Screenshot does not match : ${baseimg_path}`);
        await this.screenshots.push(diff);
      }
    }
  }

  async SSO_Login() {
    let usernameforlogin = os.userInfo().username;
    // let Environment = dataSet.execution_platform;
    if ((await testData.getData('TC_Data', this.TC_ID, 'SSO_Login')) == 'Yes') {
      //One Account - Enter Email to the field and click on the Next Button
      console.log('SSO_Login is ON');
      console.log('usernameforlogin', usernameforlogin);
      await this.oneAccountEmailField.fill(usernameforlogin);
      await this.oneAccountNextButton.click();
      await this.page.waitForTimeout(10000);

      if (await this.oneAccountPasswordField.isVisible()) {
        //await this.oneAccountPasswordField.fill('ASDFvcxz##');
        await this.oneAccountPasswordField.fill(process.env.PASSWORD);
        await this.oneAccountNextButton.click();
      }
    } else if ((await testData.getData('TC_Data', this.TC_ID, 'SSO_Login')) == 'No') {
      console.log('SSO_Login is Off');
    }
  }

  async logoutUser() {
    //Logout user from Dashboard
    await this.logoutBtnHPM.click();
    await this.page.close();
  }

  async OneAccountLogin() {
    //Get one account credetails
    let user = await testData.getData(
      'OneAccountCredentails',
      'One Account credentails for all the test cases',
      'OneAccountUser'
    );
    let userPassword = await testData.getData(
      'OneAccountCredentails',
      'One Account credentails for all the test cases',
      'OneAccountPassword'
    );

    //Decrypt password
    let password = await decryptModule.decryptPassword(userPassword);

    //Fill user name and password based on the condition
    let Environment = dataSet.execution_platform;
    if (Environment === 'LOCAL') {
      //One Account - Enter Email to the field and click on the Next Button
      if (user === null) {
        usernameforlogin = os.userInfo().username;
        await this.oneAccountEmailField.fill(usernameforlogin);
        await this.oneAccountNextButton.click();
        await this.page.waitForTimeout(10000);
      } else {
        await this.oneAccountEmailField.fill(user);
        await this.oneAccountNextButton.click();
        await this.page.waitForTimeout(10000);
      }
      if (await this.oneAccountPasswordField.isVisible()) {
        await this.oneAccountPasswordField.fill(password);
        await this.oneAccountNextButton.click();
      }
    } else if (Environment === 'SBOX') {
      //One Account - Enter Password to the field and click on the Next Button
      //Decrypt password
      let passwordSbox = await decryptModuleSBOX.decryptPassword(userPassword);
      if (user === null) {
        usernameforlogin = os.userInfo().username;
        await this.oneAccountEmailField.fill(usernameforlogin);
        await this.oneAccountNextButton.click();
      } else {
        await this.oneAccountEmailField.fill(user);
        await this.oneAccountNextButton.click();
      }
      await this.oneAccountPasswordField.fill(passwordSbox);
      await this.oneAccountNextButton.click();
    } else if (Environment === 'LOCAL_SBOX') {
      //One Account - Enter Password to the field and click on the Next Button
      if (user === null) {
        usernameforlogin = os.userInfo().username;
        await this.oneAccountEmailField.fill(usernameforlogin);
        await this.oneAccountNextButton.click();
      } else {
        await this.oneAccountEmailField.fill(user);
        await this.oneAccountNextButton.click();
      }
      await this.oneAccountPasswordField.fill(password);
      await this.oneAccountNextButton.click();
    }
  }

  //Decrypt password
  async decryptedPassword(encryptedText) {
    if (dataSet.execution_platform === 'LOCAL') {
      const text = await decryptModule.decryptPassword(encryptedText);
      return text;
    } else if (dataSet.execution_platform === 'SBOX') {
      const text = await decryptModuleSBOX.decryptPassword(encryptedText);
      return text;
    } else if (dataSet.execution_platform === 'LOCAL_SBOX') {
      const text = await decryptModule.decryptPassword(encryptedText);
      return text;
    }
  }

  async ScrollDownSS() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate() + 1).padStart(2, '0');
    const hours = String(currentDate.getHours() + 1).padStart(2, '0');
    const minutes = String(currentDate.getMinutes() + 1).padStart(2, '0');
    const seconds = String(currentDate.getSeconds() + 1).padStart(2, '0');

    const formattedDateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;

    await this.page.waitForTimeout(4000);
    let innerHeight = await this.page.evaluate(() => window.innerHeight);
    let scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);

    scrollHeight = Number(scrollHeight);
    let screenshotNumber = 1;
    await this.page.waitForTimeout(4000);
    if (innerHeight < scrollHeight) {
      do {
        screenshot = await this.page.screenshot({
          path: `${this.results_dir}/${this.TC_ID}_scrolldown_${screenshotNumber}_${formattedDateTime}.png`,
          type: 'png',
        });
        await this.page.evaluate(() => window.scrollBy(0, innerHeight));
        await this.page.waitForTimeout(2000);
        screenshot = await this.page.screenshot({
          path: `${this.results_dir}/${this.TC_ID}_scrolldown_${screenshotNumber}_${formattedDateTime}.png`,
          type: 'png',
        });
        await this.page.evaluate(() => window.scrollBy(0, innerHeight));

        screenshotNumber++;
      } while (screenshotNumber * innerHeight < scrollHeight);
    }
  }

  async openAI_Testing() {
    const open_ai = new OpenAI({
      apiKey: '',
    });

    const completion = open_ai.chat.completions.create({
      model: 'gpt-4o-mini',
      store: true,
      messages: [{role: 'user', content: 'write a haiku about ai'}],
    });
    completion.then(result => console.log(result.choices[0].message));
  }
}
module.exports = {ReusableMethodPage};
