# watermark-stamper-js

add watermark (alpha .png) to your images.

![demo](./imgs/watermarked.png)

## Usage

```shell
npm install
```

Put your watermark image (alpha png) into `watermarks` directory.
You can put multiple images.

Put your inputs image into `inputs` directory.

```shell
npm run exe
```

You can see the help.

```shell
npm run help
```

## output JPEG

```shell
node index.js -i inputs -o outputs -w watermarks --type jpg --jpegQuality 70
```

## image files

What the
[Jimp](https://www.npmjs.com/package/jimp)
supports,
it also supports.

Be careful, it only supports **sRGB** color space.
Not support **Adobe RGB** .
