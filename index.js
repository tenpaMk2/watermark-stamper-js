/**
 * @file add watermark
 */

import jimp from "jimp";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { fileURLToPath } from "url";
import commander from "commander";
import parser from "./lib/argument-parser.mjs";

// parse arguments
const options = parser.parse(process.argv)

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
