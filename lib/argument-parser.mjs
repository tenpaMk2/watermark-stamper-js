/**
 * @file argument parser
 */
import commander from "commander";
import fs from "fs";
import path from "path";

const isValidPath = (mypath) => !/[<>:"|?*]/.test(mypath);

/**
 * argument parser
 */
export class ArgumentParser {
  /**
   * argument parser for path.
   * @param {string} mypath
   * @returns {number}
   */
  parsePath(mypath, dummyPrevious) {
    if (!isValidPath(mypath)) {
      throw new commander.InvalidArgumentError("Not a valid path.");
    }
    return mypath;
  }
  /**
   * argument parser for exist path.
   * @param {string} mypath
   * @returns {number}
   */
  parseExistedPath(mypath, dummyPrevious) {
    if (!fs.existsSync(mypath)) {
      throw new commander.InvalidArgumentError("Not a existed path.");
    }
    return mypath;
  }
  /**
   * argument parser for JPEG Quality.
   * @param {number} value - jpeg quality `0 <= q <= 100` .
   * @returns {number} jpeg quality `0 <= q <= 100` .
   */
  parseJpegQuality(value, dummyPrevious) {
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
  }

  /**
   * argument parser for Opacity.
   * @param {number} value - opacity `0 < q <= 1` .
   * @returns {number} opacity `0 < q <= 1` .
   */
  parseOpacity(value, dummyPrevious) {
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
  }

  /**
   * parse argument
   * @param {string[]} argv - `process.argv`
   * @returns {Object.<string,any >}
   */
  parse(argv) {
    /**
     * command parser
     */
    const program = new commander.Command();

    program
      .addOption(
        new commander.Option("-i, --input <path>", "input directory path.")
          .argParser(this.parseExistedPath)
          .makeOptionMandatory()
      )
      .addOption(
        new commander.Option("-o, --output <path>", "output directory path.")
          .argParser(this.parsePath)
          .makeOptionMandatory()
      )
      .addOption(
        new commander.Option(
          "-w, --watermark <path>",
          "watermark directory path."
        )
          .argParser(this.parseExistedPath)
          .makeOptionMandatory()
      )
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
          .argParser(this.parseJpegQuality)
      )
      .addOption(
        new commander.Option(
          "-op, --opacity <float>",
          "the opacity of watermark. `0 < op <= 1` "
        )
          .default(0.2)
          .argParser(this.parseOpacity)
      )
      .parse(process.argv);

    return program.opts();
  }
}

export default new ArgumentParser();
