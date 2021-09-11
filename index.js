/**
 * @file add watermark
 */

import jimp from "jimp";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { fileURLToPath } from "url";
import commander from "commander";

// parse arguments

/**
 * argument parser for JPEG Quality.
 * @param {number} value - jpeg quality `0 <= q <= 100` .
 * @returns {number} jpeg quality `0 <= q <= 100` .
 */
const parseJpegQuality = (value, dummyPrevious) => {
  const integer = parseInt(value, 10);
  if (isNaN(integer)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }
  if (integer < 0) {
    return 0;
  }
  if (100 < integer) {
    return 100;
  }

  return integer;
};

/**
 * argument parser for Opacity.
 * @param {number} value - opacity `0 < q <= 1` .
 * @returns {number} opacity `0 < q <= 1` .
 */
const parseOpacity = (value, dummyPrevious) => {
  const float = parseFloat(value);
  if (isNaN(float)) {
    throw new commander.InvalidArgumentError("Not a float number.");
  }
  if (float < 0) {
    return 0;
  }
  if (1 < float) {
    return 1;
  }

  return float;
};

/**
 * command parser
 */
const program = new commander.Command();
program
  .requiredOption("-i, --input <path>", "input directory path.")
  .requiredOption("-o, --output <path>", "output directory path.")
  .requiredOption("-w, --watermark <path>", "watermark directory path.")
  .addOption(
    new commander.Option("-t, --type <type>", "image file type.")
      .choices(["jpg", "png"])
      .default("png")
  )
  .addOption(
    new commander.Option(
      "-j, --jpegQuality <numbers>",
      "jpeg quality if output is jpeg."
    )
      .default(80)
      .argParser(parseJpegQuality)
  )
  .addOption(
    new commander.Option(
      "-op, --opacity <float>",
      "the opacity of watermark. `0 < op <= 1` "
    )
      .default(0.2)
      .argParser(parseOpacity)
  )
  .parse(process.argv);

/**
 * parsed options
 */
const options = program.opts();

/**
 * @param {string} path
 * @returns {boolean}
 */
const isImagePath = (path) =>
  /.*\.(jpg|jpeg|png|tif|tiff)$/.test(path.toLowerCase());

/**
 * @param {Jimp} img - Jimp image
 * @returns {boolean} `true` is landscape. `false` is portlait.
 */
const isLandscape = (img) => img.getWidth() > img.getHeight();

/**
 * @param {string} imageDirPath
 * @returns {string[]}
 */
const getImagePaths = (imageDirPath) => {
  const resolvedPath = path.resolve(imageDirPath);
  const anyFiles = fs.readdirSync(resolvedPath);
  const imageFiles = anyFiles.filter(isImagePath);
  return imageFiles.map((imageFile) => path.resolve(imageDirPath, imageFile));
};

/**
 * @param {string} inputPaths
 * @param {string} watermarkPaths
 * @param {string} outputDirPath
 * @returns {Array}
 */
const createArguments = (inputPaths, watermarkPaths, outputDirPath, ext) => {
  let myArguments = [];
  inputPaths.forEach((inputPath) => {
    watermarkPaths.forEach((watermarkPath) => {
      const outputPath = path.resolve(
        outputDirPath,
        `${path.parse(inputPath).name}_${path.parse(watermarkPath).name}.${ext}`
      );
      myArguments.push([inputPath, watermarkPath, outputPath]);
    });
  });
  return myArguments;
};

/**
 * add the watermark of `watermarkPath` on the image of `inputPath` and export image of `outputPath` .
 * @param {string} inputPath
 * @param {string} watermarkPath
 * @param {string} outputDirPath
 * @returns {string}
 */
const addWatermark = async (inputPath, watermarkPath, outputPath) => {
  // read images
  const inputImage = await jimp.read(inputPath);
  const watermarkImage = await jimp.read(watermarkPath);

  // resize watermark image
  const watermarkWidth = isLandscape(inputImage)
    ? inputImage.getWidth() / 10
    : inputImage.getWidth() / 5;
  watermarkImage.resize(watermarkWidth, jimp.AUTO, jimp.RESIZE_BEZIER);

  // decide watermark position
  const padding = isLandscape(inputImage)
    ? inputImage.getHeight() / 100
    : inputImage.getWidth() / 100;
  const x = padding;
  const y = inputImage.getHeight() - watermarkImage.getHeight() - padding;

  // add watermark
  inputImage.composite(watermarkImage, x, y, {
    mode: jimp.BLEND_SOURCE_OVER,
    opacityDest: 1,
    opacitySource: options.opacity,
  });

  // // resize
  // if (isLandscape(inputImage)) {
  //   inputImage.resize(MAX_HEIGHT_WIDTH, jimp.AUTO, jimp.RESIZE_BEZIER);
  // } else {
  //   inputImage.resize(jimp.AUTO, MAX_HEIGHT_WIDTH, jimp.RESIZE_BEZIER);
  // }

  // set quality
  inputImage.quality(options.jpegQuality);

  // export
  await inputImage.writeAsync(outputPath);

  return `done: ${outputPath}`;
};

const main = async () => {
  console.log(
    chalk.bgRed.white("Be careful!! You can only use sRGB color-space!!")
  );

  // list up image files
  const imageFiles = getImagePaths(options.input);
  const watermarkFiles = getImagePaths(options.watermark);

  // create arguments array
  const myArguments = createArguments(
    imageFiles,
    watermarkFiles,
    path.resolve(options.output),
    options.type
  );

  // add watermark!!
  const promises = myArguments.map((myArgument) => addWatermark(...myArgument));

  // wait all done
  Promise.all(promises).then((val) => {
    console.log(val);
  });
};

await main();
