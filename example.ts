import { Merger, EffectLoop } from "./mergepass";
import { Brightness } from "./effects/brightness";
import { Blur } from "./effects/blur";
import { Grain } from "./effects/grain";
import { HSV } from "./effects/hsv";
import {
  HueAdd,
  SaturationAdd,
  Hue,
  Saturation,
  Value,
} from "./effects/hsvhelpers";
import { PowerBlur } from "./effects/powerblur";

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const gl = glCanvas.getContext("webgl2");

if (gl === null) {
  throw new Error("problem getting the gl context");
}

const sourceCanvas = document.getElementById("source") as HTMLCanvasElement;
const source = sourceCanvas.getContext("2d");

if (source === null) {
  throw new Error("problem getting the source context");
}

window.addEventListener("load", () => {
  // TODO don't need the mediump float probably
  const brightness = new Brightness(["uBrightness", 0.0]);
  const hsv = new HSV([0, 0.1, 0], [0, 1, 0]);
  const blur = new Blur(["uBlur", [1, 1]]);
  const blur2 = new Blur([[0, 8]]);
  const blur3 = new Blur(["uBlurSide", [8, 0]]);
  const grain = new Grain(0.1);
  const hueAdd = new HueAdd(["uHue", 0]);
  const saturationAdd = new SaturationAdd(-0.3);
  const hue = new Hue(0.7);
  const saturation = new Saturation(0.5);
  const value = new Value(["uValue", 0.5]);

  /*
  const merger = new Merger(
    [
      new EffectLoop([blur2, blur3], {
        num: 1,
      }),
    ],
    sourceCanvas,
    gl
  );
  */

  const powerBlur = new PowerBlur(16);

  const merger = new Merger([hueAdd, powerBlur, grain], sourceCanvas, gl);

  // dwitter sim
  const C = Math.cos;
  const S = Math.sin;

  const x = source;
  const c = sourceCanvas;

  let steps = 0;

  const draw = (time: number) => {
    const t = steps / 60;
    steps++;
    brightness.setUniform("uBrightness", 0.3 * Math.cos(time / 2000));
    //blur.setUniform("uBlur", [Math.cos(time / 1000) ** 8, 0]);
    hueAdd.setUniform("uHue", t / 9);
    powerBlur.setSize(64 * Math.cos(time / 1000) ** 8);

    // draw insane stripes
    const i = ~~(t * 9);
    const j = ~~(i / 44);
    const k = i % 44;
    x.fillStyle = `hsl(${(k & j) * i},40%,${50 + C(t) * 10}%`;
    x.fillRect(k * 24, 0, 24, k + 2);
    x.drawImage(c, 0, k + 2);
    merger.draw();
    requestAnimationFrame(draw);
  };

  /*
  x.fillStyle = "red";
  x.fillRect(0, 0, 960, 540);
  x.fillStyle = "blue";
  x.fillRect(960 / 4, 540 / 4, 960 / 2, 540 / 2);

  setTimeout(() => {
    console.log("draw");
    merger.draw();
  }, 1000);

  setTimeout(() => {
    console.log("draw");
    merger.draw();
  }, 2000);

  setTimeout(() => {
    console.log("draw");
    merger.draw();
  }, 3000);

  setTimeout(() => {
    console.log("draw");
    merger.draw();
  }, 4000);
  */

  draw(0);
});
glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
