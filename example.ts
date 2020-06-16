import * as MP from "./index";

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
  const hFloat = MP.float(MP.mut(1));
  const vFloat = MP.float(MP.mut(1));
  const merger = new MP.Merger(
    [
      MP.ssample(),
      MP.blur2d(
        MP.mul(MP.len(MP.ncfcoord()), 3),
        MP.mul(MP.len(MP.ncfcoord()), 3),
        6
      ),
    ],
    sourceCanvas,
    gl
  );
  //const merger = new MP.Merger([MP.ssample()], sourceCanvas, gl);

  // dwitter sim
  const C = Math.cos;
  const S = Math.sin;

  const x = source;
  const c = sourceCanvas;

  let steps = 0;

  const draw = (time: number) => {
    const t = steps / 60;
    steps++;

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
