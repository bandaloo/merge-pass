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
  // TODO check if we need mediump float (it already doesn't work on mobile)
  const brightness = new Brightness(["uBrightness", 0.0]);
  const hsv = new HSV([0, 0.1, 0], [0, 1, 0]);
  const blur = new Blur(["uBlur", [1, 1]]);
  const blur2 = new Blur([[0, 0]]);
  const blur3 = new Blur(["uBlurSide", [0, 8]]);
  const grain = new Grain(0.1);
  const hueAdd = new HueAdd(["uHue", 0]);
  const saturationAdd = new SaturationAdd(-0.3);
  const hue = new Hue(0.7);
  const saturation = new Saturation(0.5);
  const value = new Value(["uValue", 0.5]);

  /*
  const merger = new Merger(
    [
      new EffectLoop([hueAdd, new EffectLoop([grain], { num: 2 })], {
        num: 1,
      }),
    ],
    sourceCanvas,
    gl
  );
  */
  //const merger = new Merger([hue, grain], sourceCanvas, gl);

  const powerBlur = new PowerBlur(8);

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
    powerBlur.setSize(8 * Math.cos(time / 1000) ** 8);

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

  x.fillStyle = "black";
  x.fillRect(0, 0, 960, 540);
  x.font = "99px monospace";
  x.fillStyle = "white";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("hello world", 960 / 2, 540 / 4);

  draw(0);
});

glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
