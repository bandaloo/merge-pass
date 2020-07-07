# merge-pass

This library allows you to easily run a combination of post-processing
effects on an image or canvas. It does so by generating shaders to apply the
effect in as few passes as possible.

Right now, this package is in pre-alpha. If you have tried using this library
and have an idea of how to improve it, let me know!

## Live Example

This [live example](https://www.bandaloo.fun/merge-pass/example.html) shows multiple
demos that with code samples. This shows off the variety of effects you can create
with this library.

## Usage Example

This [usage example](https://github.com/bandaloo/merge-pass-usage) will show
you how to get started with using 2D images such as canvases and videos. This
[other example](https://github.com/bandaloo/one-context-merge-pass) shows you
how to use this library with only a single WebGL2 rendering context and textures
instead of images.

## Package

Here is the [package on npm](https://www.npmjs.com/package/@bandaloo/merge-pass).

## Development

Run `npm run build` and `npm run bundle` to create the compiled
`dist/index.js`. Alternatively, you could run `npm run buildwatch` and
`npm run bundlewatch` in separate sessions to get live updates. To build the
docs, run `npm run docs` and run a local server that serves everything in the
`docs` folder.
