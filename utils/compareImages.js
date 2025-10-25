const {ensureFile, pathExists} = require('fs-extra');
const pixelmatch = require('pixelmatch');
const {PNG} = require('pngjs');
const fs = require('fs');
const {writeFileSync} = require('fs');
const {join} = require('path');

/**
 * Compares a screenshot to a base image,
 * if the base image doesn't exist it fails the test but creates a new base image based on
 * the screenshot passed so it can be used on the next run.
 * @param screenshot a playwright screenshot
 * @param customWorld needed to create the base image path
 * @param threshold the difference threshold
 */
class compareImages {
  getImagePath(TC_ID, name) {
    return join(`./${TC_ID}/${name}.png`);
  }
  async compareToBaseImage(name, screenshot, threshold) {
    let baseImage;
    const baseImagePath = name;
    const baseImgExist = await pathExists(baseImagePath);
    if (baseImgExist) {
      baseImage = PNG.sync.read(fs.readFileSync(baseImagePath));
    } else {
      await ensureFile(baseImagePath);
      writeFileSync(baseImagePath, screenshot);
      console.log(
        `The base Image doesn't exist, a screenshot was taken to ${baseImagePath} so it can be used for next run`
      );
      return;
    }
    const img1 = PNG.sync.read(screenshot);
    const {width, height} = baseImage;
    let diff = new PNG({width, height});
    const difference = pixelmatch(img1.data, baseImage.data, diff.data, width, height, threshold);
    //console.log(`Difference Value ${difference}`);

    if (difference > 0) {
      return PNG.sync.write(diff);
    } else {
      return difference;
    }
  }
}

module.exports = {compareImages};
