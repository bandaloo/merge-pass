# merge-pass

This library allows you to easily run a combination of post-processing
effects on an image, canvas or existing texture. It does so by generating
shaders to apply the effect in as few passes as possible. It is also flexible
enough to allow you to build your own custom effects and update their
uniforms at runtime.

## Live Example

This [live example](https://www.bandaloo.fun/merge-pass/example.html) shows
multiple demos with code samples.

## Motivation

merge-pass lets you author a complex post-processing effect in a simple way.
This effect might read from and write to textures, require multiple passes
and have many uniforms. merge-pass will emit a tree of GLSL shaders that do
the job, and create/manage the resources required for your post-processing
effect.

Why don't you just write your own GLSL? This works great in a bunch of cases.
However, if you need an effect that requires RTT (render-to-texture) and
performs multiple passes on the same image, then it's all of the sudden
pretty annoying: you have to split your logic across multiple shaders and
manage a bunch of resources, like switching between programs and
"ping-ponging" between textures. If you've split your effect into separate
shaders that run in sequence, now you have to worry about when you're able to
update uniforms in those shaders, since you can only update a uniform if the
program is in use. Additionally, a uniform might exist in one shader but not
another. merge-pass offers abstractions to address these usability woes, as
well as providing helpful higher-level expressions such as noise, blurs,
bloom, godrays and depth of field. The multiple demos on
[this website](https://www.bandaloo.fun/merge-pass/example.html) will show
you just how expressive you can be with this library.

## Docs

The docs are available [here](https://www.bandaloo.fun/docs/).

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

## Acknowledgements

Special thanks to Charlie Roberts for offering feedback on the design of
this API and by helping bug test by integrating this library into the
[marching.js](https://github.com/charlieroberts/marching) online playground.
