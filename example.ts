import { Merger } from "./mergepass";
import { Brightness } from "./effects/brightness";
import { Blur } from "./effects/blur";

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

window.onload = () => {
  const darkenEffect = new Brightness(["uBrightness", 0]);
  const blurEffect = new Blur(["uBlur", [1, 1]]).repeat(3);

  const merger = new Merger([blurEffect, darkenEffect], sourceCanvas, gl);

  source.fillStyle = "orange";
  source.fillRect(0, 0, 960, 540);
  source.fillStyle = "purple";
  source.fillRect(960 / 4 - 100, 540 / 4 - 100, 960 / 2, 540 / 2);

  const draw = (time: number) => {
    merger.draw();
    const darkness = 0.5 + Math.cos(time / 99) / 2;
    darkenEffect.setUniform("uBrightness", 0.5 + darkness / 3);
    blurEffect.setUniform("uBlur", [
      3 * Math.cos(time / 999),
      3 * Math.sin(time / 999),
    ]);
    requestAnimationFrame(draw);
  };

  draw(0);
};
