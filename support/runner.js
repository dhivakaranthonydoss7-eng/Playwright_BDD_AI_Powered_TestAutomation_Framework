const helper = require('./helper');
const testData = new helper.Helper();

class runner {
  async getrunner() {
    testData.getRunManager('Regression');
  }
}

module.exports = {runner};
