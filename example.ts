import { Merger } from "./mergepass";
import { darken, invert, red } from "./effect";

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

// TODO get rid of onload if not necessary
window.onload = () => {
  //const merger = new Merger([darken(50), invert()], source, gl);
  const merger = new Merger([red()], source, gl);

  source.fillStyle = "orange";
  source.fillRect(0, 0, 960, 540);
  source.fillStyle = "purple";
  source.fillRect(960 / 4, 540 / 4, 960 / 2, 540 / 2);

  merger.draw();
};
