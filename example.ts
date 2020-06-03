import { Merger } from "./mergepass";
import { darken, invert, red, nothing, blur5, repeat } from "./effect";

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
  // TODO make merger take in a TexImageSource rather than a canvas rendering context
  //const merger = new Merger([invert(), darken(50)], source, gl);
  //const merger = new Merger([red()], source, gl);
  //const merger = new Merger([nothing()], source, gl);
  //const merger = new Merger([blur5(1, 1)], source, gl);
  //const merger = new Merger([repeat(blur5(1, 1), 1)], source, gl);
  //const merger = new Merger([invert(), repeat(darken(50), 3)], source, gl);
  /*
  const merger = new Merger(
    [invert(), repeat(darken(50), 3), blur5(2, 2)],
    source,
    gl
  );
  */

  // this creates three programs because blur is in the middle and needs 3 passes
  /*
  const merger = new Merger(
    [repeat(darken(50), 2), repeat(blur5(1, 1), 3), invert()],
    source,
    gl
  );
  */

  // this creates only one program because blur has 1 pass and is at beginning
  const merger = new Merger(
    [blur5(1, 1), repeat(darken(50), 2), invert()],
    sourceCanvas,
    gl
  );

  source.fillStyle = "orange";
  source.fillRect(0, 0, 960 - 100, 540 - 100);
  source.fillStyle = "purple";
  source.fillRect(960 / 4, 540 / 4, 960 / 2, 540 / 2);

  merger.draw();
};
