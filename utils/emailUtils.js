const {expect} = require('@playwright/test');
const {Helper} = require('../support/helper');
const testData = new Helper();
let token;

/**
 *  Fetch the expected URL from first email
 */
async function fetchAndProcessDataForFirstEmail(url, method, func, currentTime) {
  let extractedData = null;
  console.log('Before fetch');
  //***** Get the token from datasheet and using it in API request header to get email response *****
  token = await testData.getData('Pre_requisites', 'Create a Microsoft authentication token for email access', 'Token');
  console.log('the new token is :' + token);
  await expect(async () => {
    const response = await fetch(url, {
      headers: {
        Accept: '*/*',
        authorization: token,
        prefer: 'ms-graph-dev-mode',
        priority: 'u=1, i',
        sdkversion: 'GraphExplorer/4.0, graph-js/3.0.7 (featureUsage=6)',
      },
      body: null,
      method,
    });
    console.log('After fetch');

    //***** Assert the API response is OK *****
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    //***** Convert the API response into JSON *****
    const data = await response.json();

    //***** Retrieve the expected email responses using sentDateTime > currentTime *****
    const mail = data.value.filter(
      message => new Date(message.sentDateTime).toISOString() > currentTime.toISOString()
    )[1];

    //***** Get the expected URL from email using email response content *****
    extractedData = await func(mail.body.content);

    //***** Assert expected data should not be null *****
    expect(extractedData, 'Data should not be null').not.toBeNull();
  }).toPass({timeout: 250000});
  if (extractedData === null) {
    throw new Error('Data not defined');
  }
  return extractedData;
}

/**
 *  Fetch the expected URL from second email
 */
async function fetchAndProcessDataForSecondEmail(url, method, func, currentTime) {
  let extractedData = null;
  console.log('Before fetch');

  //***** Get the token from datasheet and using it in API request header to get email response *****
  token = await testData.getData('Pre_requisites', 'Create a Microsoft authentication token for email access', 'Token');
  console.log('token is :' + token);
  await expect(async () => {
    const response = await fetch(url, {
      headers: {
        Accept: '*/*',
        authorization: token,
        prefer: 'ms-graph-dev-mode',
        priority: 'u=1, i',
        sdkversion: 'GraphExplorer/4.0, graph-js/3.0.7 (featureUsage=6)',
      },
      body: null,
      method,
    });
    console.log('After fetch');

    //***** Assert the API response is OK *****
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    console.log('before response');

    //***** Convert the API response into JSON *****
    const data = await response.json();

    //***** Retrieve the expected email responses using sentDateTime > currentTime *****
    const mail = data.value.filter(
      message => new Date(message.sentDateTime).toISOString() > currentTime.toISOString()
    )[0];

    //***** Get the expected URL from email using email response content *****
    extractedData = await func(mail.body.content);

    //***** Assert expected data should not be null *****
    expect(extractedData, 'Data should not be null').not.toBeNull();
  }).toPass({timeout: 250000});
  if (extractedData === null) {
    throw new Error('Data not defined');
  }
  return extractedData;
}

/**
 *  Fetch the expected URL from first email
 */
async function fetchAndProcessDataForFirstEmailForHpmImprovements(url, method, func, currentTime) {
  let extractedData = null;
  console.log('Before fetch');
  //***** Get the token from datasheet and using it in API request header to get email response *****
  token = await testData.getData('Pre_requisites', 'Create a Microsoft authentication token for email access', 'Token');
  console.log('the new token is :' + token);
  await expect(async () => {
    const response = await fetch(url, {
      headers: {
        Accept: '*/*',
        authorization: token,
        prefer: 'ms-graph-dev-mode',
        priority: 'u=1, i',
        sdkversion: 'GraphExplorer/4.0, graph-js/3.0.7 (featureUsage=6)',
      },
      body: null,
      method,
    });
    console.log('After fetch');

    //***** Assert the API response is OK *****
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    //***** Convert the API response into JSON *****
    const data = await response.json();

    //***** Retrieve the expected email responses using sentDateTime > currentTime *****
    const mail = data.value.filter(
      message => new Date(message.sentDateTime).toISOString() > currentTime.toISOString()
    )[0];

    //***** Get the expected URL from email using email response content *****
    extractedData = await func(mail.body.content);

    //***** Assert expected data should not be null *****
    expect(extractedData, 'Data should not be null').not.toBeNull();
  }).toPass({timeout: 250000});
  if (extractedData === null) {
    throw new Error('Data not defined');
  }
  return extractedData;
}

/**
 *  Extract the expected URL from string
 */
function extractLinkFromString(inputString) {
  const hrefPattern = /https:\/\/[^\s]+/g;
  const match = inputString.match(hrefPattern);
  if (!match) return null;
  return match[1];
}

/**
 *  Get expected URL from email
 */
async function getLinkFromFirstMail(currentTime) {
  const link = await fetchAndProcessDataForFirstEmail(
    'https://graph.microsoft.com/v1.0/me/messages?$search="[EXTERNAL] Sandbox: 【アクサ生命】健康経営優良法人2025 申請書チェックのご案内"',
    'GET',
    extractLinkFromString,
    currentTime
  );
  return link;
}

/**
 *  Get expected URL from email
 */
async function getLinkFromSecondMail(currentTime) {
  const link = await fetchAndProcessDataForSecondEmail(
    'https://graph.microsoft.com/v1.0/me/messages?$search="[EXTERNAL] Sandbox: 【アクサ生命】健康経営優良法人2025 申請書チェックのご案内"',
    'GET',
    extractLinkFromString,
    currentTime
  );
  return link;
}

/**
 *  Get expected URL from email
 */
async function getLinkFromFirstMailForHpmImprovements(currentTime) {
  const link = await fetchAndProcessDataForFirstEmailForHpmImprovements(
    'https://graph.microsoft.com/v1.0/me/messages?$search="[EXTERNAL] Sandbox: 【アクサ生命】健康経営優良法人2025 申請書チェックのご案内"',
    'GET',
    extractLinkFromString,
    currentTime
  );
  return link;
}

module.exports = {
  fetchAndProcessDataForFirstEmail,
  fetchAndProcessDataForSecondEmail,
  getLinkFromFirstMail,
  getLinkFromSecondMail,
  getLinkFromFirstMailForHpmImprovements,
};
