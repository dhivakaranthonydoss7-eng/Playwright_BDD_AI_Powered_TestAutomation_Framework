/* eslint-disable no-unused-vars */
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const selectorsPath = 'selectors.json';
let selectors = JSON.parse(fs.readFileSync(selectorsPath, 'utf8'));
async function getPageHTML(page) {
  return await page.evaluate(() => document.documentElement.outerHTML);
}
async function getAlternativeSelector(failedSelector, description, pageHTML) {
  const apiKey = '';
  const prompt = `The element described as "${description}" was expected at "${failedSelector}" but was not found.
   Based on the following HTML, suggest the best possible new xpath locator:
   ${pageHTML.substring(0, 10000)}  // Limit to 10,000 characters to optimize API efficiency.
   Return ONLY the xpath locator, nothing else.`;
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{role: 'user', content: prompt}],
      },
      {
        headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return null;
  }
}
async function updateSelectorsFile(selectorKey, newSelector) {
  selectors[selectorKey].primary = newSelector;
  fs.writeFileSync(selectorsPath, JSON.stringify(selectors, null, 2));
  console.log(`Updated selectors.json with AI-suggested selector: ${newSelector}`);
}
async function selfHealingClick(page, selectorKey, description) {
  let selectorData = selectors[selectorKey];
  if (!selectorData) throw new Error(`No selector found for ${selectorKey}`);
  const primarySelector = selectorData.primary;
  try {
    await page.click(primarySelector);
    console.log(`Clicked using primary selector: ${primarySelector}`);
    return;
  } catch (error) {
    console.warn(`Primary selector failed: ${primarySelector}`);
  }
  console.warn(`Selector for ${description} failed. Asking AI...`);
  const pageHTML = await getPageHTML(page);
  const aiSelector = await getAlternativeSelector(primarySelector, description, pageHTML);
  let ai_Selector = aiSelector.replace(/'''|```|xpath|\n/g, '').trim();
  if (ai_Selector) {
    try {
      await page.locator(ai_Selector).locator('visible=true').click();
      console.log(`Clicked using AI-suggested selector: ${ai_Selector}`);
      // Update JSON for future runs
      await updateSelectorsFile(selectorKey, ai_Selector);
      return;
    } catch (error) {
      console.error(`AI-suggested selector failed: ${ai_Selector}`);
    }
  }
  throw new Error(`No valid selector found for ${description}`);
}
module.exports = {selfHealingClick};
