/* eslint-disable no-undef */
const {After, AfterStep, Before, setDefaultTimeout} = require('@cucumber/cucumber');
const {chromium} = require('@playwright/test');
const {ReusableMethods} = require('../utils/ReusableMethods.js');
const fs = require('fs');
const reuse = new ReusableMethods();
const datatablelink = require('./helper.js');
const dataSet = JSON.parse(JSON.stringify(require('../datatables/json/constants.json')));
const {Helper} = require('../support/helper');
const testData = new Helper();

Before(async function (scenario) {
  setDefaultTimeout(50000);
  datatablelink.datatable();
  this.featurename = scenario.gherkinDocument.feature.name;
  this.scenarioName = scenario.pickle.name;
  this.TC_ID = this.scenarioName;
  this.resultfolder = await reuse.dateandtime();
  this.resultfolder = this.TC_ID + '_' + this.resultfolder;
  this.results_dir = `./test-results/screenshots/${this.resultfolder}`;
  this.screenshots = [];
  console.log(`Running Test: ${this.TC_ID}`);
  if (!fs.existsSync(this.results_dir)) {
    fs.mkdirSync(this.results_dir, {recursive: true});
  }
});

Before({timeout: 1000 * 1000}, async function () {
  if (dataSet.execution_platform === 'LOCAL') {
    this.browser = await chromium.launch({
      channel: 'msedge',
      headless: false,
      args: ['--start-maximized', '--disable-extensions', '--disable-plugins'],
      downloadsPath: './Downloads',
      'pdfjs.disabled': false,
      'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,
      'plugins.always_open_pdf_externally': true,
    });
    this.context = await this.browser.newContext({
      viewport: null,
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      recordVideo: process.env.RECORD_VIDEO === 'true' ? {dir: './test-results/videos'} : undefined,
    });
  } else if (dataSet.execution_platform === 'SBOX') {
    //wss connection
    const wsEndpoint = '';
    this.browser = await chromium.connect(wsEndpoint);
    // proxy needed for JP URL connectivity
    this.context = await this.browser.newContext({
      viewport: {width: 1366, height: 728},
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      userAgent: 'windows nt edg',
    });
  } else if (dataSet.execution_platform === 'LOCAL_SBOX') {
    //wss connection
    const wsEndpoint = '';
    this.browser = await chromium.connect(wsEndpoint);
    // proxy needed for JP URL connectivity
    this.context = await this.browser.newContext({
      viewport: {width: 1366, height: 728},
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      userAgent: 'windows nt edg',
    });
  }
  this.page = await this.context.newPage();
  await this.page.waitForLoadState('networkidle');
  this.ReusableMethods = new ReusableMethods(this.page, this.results_dir, this.TC_ID);
});

AfterStep(async function () {
  if (this.screenshots.length == 0) {
    console.log(`No Screenshots taken in this Step`);
  } else {
    console.log(`No of Screenshots is ${this.screenshots.length}`);
    let sheetname;
    //console.log(`Feature name for screenshot is ${this.featurename}`);
    if (this.featurename == 'SecurityPatch') {
      sheetname = 'Security_Patch';
    } else {
      sheetname = 'TC_Data';
    }
    if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'No') {
      console.log('Screenshot Parameter is set to NO');
    } else if ((await testData.getData(sheetname, this.TC_ID, 'Screenshot')) == 'Yes') {
      for (let i = 0; i < this.screenshots.length; i++) {
        if (typeof this.screenshots[i] === 'string') {
          this.attach(this.screenshots[i]);
        } else {
          this.attach(this.screenshots[i], 'image/png');
        }
      }
      while (this.screenshots.length > 0) {
        this.screenshots.shift();
      }
    }
  }
});

After(async function () {
  await this.browser.close();
});
