const {CucumberJSAllureFormatter, AllureRuntime} = require('allure-cucumberjs');
const dataSet = JSON.parse(JSON.stringify(require('../datatables/json/constants.json')));

module.exports = class extends CucumberJSAllureFormatter {
  constructor(options) {
    super(options, new AllureRuntime({resultsDir: `./allure-results/${dataSet.allure}`}), {
      labels: [
        {
          pattern: [/@feature:(.*)/],
          name: 'epic',
        },
        {
          pattern: [/@severity:(.*)/],
          name: 'severity',
        },
      ],
      links: [
        {
          pattern: [/@issue=(.*)/],
          type: 'issue',
          urlTemplate: 'http://localhost:8080/issue/%s',
        },
        {
          pattern: [/@tms=(.*)/],
          type: 'tms',
          urlTemplate: 'http://localhost:8080/tms/%s',
        },
      ],
    });
  }
};
