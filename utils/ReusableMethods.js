class ReusableMethods {
  constructor(page, results_dir, TC_ID) {
    this.page = page;
    this.results_dir = results_dir;
    this.TC_ID = TC_ID;
  }

  async dateandtime() {
    let currentdate = new Date();
    let datetime =
      currentdate.getDate() +
      '_' +
      (currentdate.getMonth() + 1) +
      '_' +
      currentdate.getFullYear() +
      '_' +
      currentdate.getHours() +
      '_' +
      currentdate.getMinutes() +
      '_' +
      currentdate.getSeconds();
    console.log(datetime);
    return datetime;
  }

  async takeScreenshot(screenName) {
    let screenshot = await this.page.screenshot({
      path: `${this.results_dir}/${this.TC_ID}_${screenName}.png`,
      type: 'png',
    });
    return screenshot;
  }
}

module.exports = {ReusableMethods};
