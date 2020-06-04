import { Merger } from "./mergepass";
import {
  darken,
  invert,
  red,
  nothing,
  blur5,
  repeat,
  fuzzy,
  brightness,
  uniformTest,
} from "./effect";

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
  //const merger = new Merger([invert(), darken(50)], source, gl);
  //const merger = new Merger([red()], source, gl);
  //const merger = new Merger([nothing()], source, gl);
  // a new kind of blur?
  /*
  const merger = new Merger(
    [
      repeat(blur5(8, 0), 3),
      repeat(blur5(0, 8), 3),
      repeat(blur5(4, 0), 2),
      repeat(blur5(0, 4), 2),
      repeat(blur5(2, 0), 1),
      repeat(blur5(0, 2), 1),
      brightness(0.3),
    ],
    sourceCanvas,
    gl
  );
  */
  // TODO consider how things would be effected if source and destination weren't the same size
  //const merger = new Merger([repeat(blur5(1, 1), 1)], source, gl);
  //const merger = new Merger([invert(), repeat(darken(50), 3)], source, gl);
  /*
  const merger = new Merger(
    [invert(), repeat(darken(50), 3), blur5(2, 2)],
    source,
    gl
  );
  */
  //const merger = new Merger([fuzzy()], sourceCanvas, gl);

  // this creates three programs because blur is in the middle and needs 3 passes
  /*
  const merger = new Merger(
    [repeat(darken(50), 2), repeat(blur5(1, 1), 3), invert()],
    source,
    gl
  );
  */

  // this creates only one program because blur has 1 pass and is at beginning
  /*
  const merger = new Merger(
    [blur5(1, 1), repeat(darken(50), 2), invert()],
    sourceCanvas,
    gl
  );
  */

  const merger = new Merger([uniformTest()], sourceCanvas, gl);

  // TODO consider unlinking programs

  source.fillStyle = "orange";
  source.fillRect(0, 0, 960, 540);
  source.fillStyle = "purple";
  source.fillRect(960 / 4 - 100, 540 / 4 - 100, 960 / 2, 540 / 2);

  merger.draw();

  console.log("built and bundled");
};
