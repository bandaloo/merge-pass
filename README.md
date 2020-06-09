# merge-pass

[live example](https://www.bandaloo.fun/merge-pass-temp/example.html)

**Right now, this package is in pre-alpha so I wouldn't recommend using it for
anything big yet. However, if you want to try it out, you are more than
welcome. Also, if you have any ideas for post-processing effects you would
like to see included in the library, please let me know!**

This library allows you to easily run a combination of post-processing
effects on an image or canvas. It does so by generating shaders to apply the
effect in as few passes as possible.

## Code Example

```javascript
import * as MP from "@bandaloo/merge-pass";
import { EffectLoop } from "@bandaloo/merge-pass";

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

const grain = new MP.Grain(0.1);

// by default, we will not be able to change the grain level in the above
// effect; if we want the value to be a uniform so we can change it, we could
// wrap it in a list and include a name like this:

const hueAdd = new MP.HueAdd(["uHue", 0]);

// we can leave off the name and still make the value mutable. in the line
// below, we could have done `MP.Blur(["uBlur", [1, 0]])` but we did it this
// way instead:

const horizontalBlur = new MP.Blur([[1, 0]]);

// `repeat` returns an `EffectLoop` that repeats the effect the given amount of times

const horizontalBlurLoop = horizontalBlur.repeat(2);

// let's also create a vertical blur and a loop that repeats it twice

const verticalBlur = new MP.Blur([[0, 1]]);

const verticalBlurLoop = verticalBlur.repeat(2);

// let's put both of these blurs into a loop that repeats twice

const totalBlurLoop = new EffectLoop([horizontalBlurLoop, verticalBlurLoop], {
  num: 2,
  func: (pass) => {
    // `func` is optional, but it lets you pass in a callback that does
    // something (like change a uniform) on each loop. this particular function
    // doesn't do anything. `pass` increments from zero on every loop. this is
    // useful internally; it's okay if you never find a use for this as a user
  },
});

// create the merger with your source canvas and target rendering context

const merger = new MP.Merger([totalBlurLoop, hueAdd, grain], sourceCanvas, gl, {
  minFilterMode: "linear", // could also be "nearest"
  maxFilterMode: "linear", // could also be "nearest"
  edgeMode: "clamp", // cloud also be "wrap"
});

// in this example, the merger will compile the `hueAdd` effect and the `grain`
// effect into a single program, since they can be done in one pass by a single
// shader

// you can leave off the options object at the end. in this example, the options
// object being passed in is actually just the default values, so it would be
// the same if you simply got rid of the last argument

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

  const blurSize = Math.cos(time / 1000) ** 8;

  hueAdd.setUniform("uHue", t / 9); // we can set a uniform by name

  // we can also set uniforms with member functions on the effect, which allows
  // you to set mutable values we didn't give a specfic name

  horizontalBlur.setDirection([blurSize, 0]);
  verticalBlur.setDirection([0, blurSize]);

  // reminder that we can't do `grain.setGrain(0.2)` because we made the grain
  // amount immutable when we created it; our merger compiled the shader with
  // the grain level as a hard-coded as 0.1, and not as a uniform. if we want to
  // change the grain level dynamically, we could have done `new Grain[[0.1]]`
  // or `new Grain["uGrain", [0.1]]`

  // draw crazy stripes (adapted from my dweet https://www.dwitter.net/d/18968)

  const i = Math.floor(t * 9);
  const j = Math.floor(i / 44);
  const k = i % 44;
  source.fillStyle = `hsl(${(k & j) * i},40%,${50 + Math.cos(t) * 10}%)`;
  source.fillRect(k * 24, 0, 24, k + 2);
  source.drawImage(sourceCanvas, 0, k + 2);

  requestAnimationFrame(draw);
};

// run the draw function when everything is loaded
window.onload = () => {
  draw(0);
};
```
