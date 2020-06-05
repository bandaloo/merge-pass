# merge-pass

This library allows you to easily run a post-processing effect on an image or
canvas. It does so by generating shaders to apply the effect in as few passes
as possible.

## Code Example

```javascript
import * as MP from "@bandaloo/merge-pass";

// for simplicity, we imported everything as `MP` but you can also easily import
// only what you need

// if you're using node, you'll need to use a bundler in order to get it to work
// on the web

// get your source and draw canvas/context from the document

const glCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
  "gl"
));

const gl = glCanvas.getContext("webgl2");

if (gl === null) {
  throw new Error("problem getting the gl context");
}

const sourceCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
  "source"
));

const source = sourceCanvas.getContext("2d");

if (source === null) {
  throw new Error("problem getting the source context");
}

// let's create our first effect

const brightness = new MP.Brightness(["uBrightness", 0.0]);

// we could have done `new MP.Brightness(0.0)` but but we wrapped it in another
// list to make that value a uniform and give it a name. the package comes with
// type information for these tuples. basically, a `Float` is either just a
// number or `[string, number]` and the same goes with vectors; a `Vec2` is
// either `[number, number]` or `[string, [number, number]]`. you would omit the
// name if you didn't need to change that value dynamically; the generated code
// will also be also little more efficient

// the blur will pingpong between two textures 3 times for a stronger effect

const blur = new MP.Blur(["uBlur", [1, 1]]).repeat(3);

// we don't need to adjust the grain level dynamically so we pass in an unnamed value

const grain = new MP.Grain(0.1);

// we attach a uniform for the hue effect so we can rotate it over time

const hueAdd = new MP.HueAdd(["uHue", 0]);

// create the merger with your source canvas

const merger = new MP.Merger(
  [blur, hueAdd, grain, brightness],
  sourceCanvas,
  gl
);

// this particular merger will have compiled two webgl program. the blur pass is
// in its own program since it needs to sample its neighbors on multiple passes.
// the last three effects can be smashed together into a single shader (look at
// the console for the generated code)

// instead of a canvas for the source, you can pass anything of type
// `TexImageSource`, which includes: `ImageBitmap | ImageData | HTMLImageElement
// | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas` so it is actually
// pretty flexible

// let's draw something interesting and kick of a draw loop

let steps = 0;

const draw = (time) => {
  const t = steps / 60;
  steps++;
  merger.draw();

  // set the uniforms in the effects we created. the merger will make sure that
  // these are only sent down when the program is in use and when the values
  // have changed

  brightness.setUniform("uBrightness", 0.3 * Math.cos(time / 2000));
  blur.setUniform("uBlur", [Math.cos(time / 1000) ** 8, 0]);
  hueAdd.setUniform("uHue", t / 9);

  // draw crazy stripes (adapted from my dweet https://www.dwitter.net/d/18968)

  const i = Math.floor(t * 9);
  const j = Math.floor(i / 44);
  const k = i % 44;
  source.fillStyle = `hsl(${(k & j) * i},40%,${50 + Math.cos(t) * 10}%)`;
  source.fillRect(k * 24, 0, 24, k + 2);
  source.drawImage(sourceCanvas, 0, k + 2);

  requestAnimationFrame(draw);
};

draw(0);
```
