import * as MP from "./index";
import { Merger } from "./mergepass";

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

function getVariable(variable: string) {
  let query = window.location.search.substring(1);
  let vars = query.split("&");

  for (var i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");

    if (pair[0] == variable) return pair[1];
  }
}

// dwitter sim
const C = Math.cos;
const S = Math.sin;

const x = source;
const c = sourceCanvas;

interface Demos {
  [name: string]: () => {
    merger: MP.Merger;
    change: (merger: MP.Merger, time: number, frame: number) => void;
  };
}

const demos: Demos = {
  blur: () => {
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

    return {
      merger: merger,
      change: (merger: MP.Merger, time: number, frame: number) => {},
    };
  },
};

interface Draws {
  [name: string]: (time: number, frames: number) => void;
}

const draws: Draws = {
  blur: (t: number, frames: number) => {
    if (frames === 0) {
      x.fillStyle = "black";
      x.fillRect(0, 0, 960, 540);
      x.font = "99px monospace";
      x.fillStyle = "white";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("hello world", 960 / 2, 540 / 4);
    }
    // draw insane stripes
    const i = frames;
    const j = ~~(i / 44);
    const k = i % 44;
    x.fillStyle = `hsl(${(k & j) * i},40%,${50 + C(frames) * 10}%`;
    x.fillRect(k * 24, 0, 24, k + 2);
    x.drawImage(c, 0, k + 2);
    //merger.draw();
  },
};

window.addEventListener("load", () => {
  let mstr = getVariable("m");
  let dstr = getVariable("d");

  console.log(mstr, dstr);
  if (mstr === undefined || demos[mstr] === undefined) mstr = "blur"; // default demo
  if (dstr === undefined || draws[dstr] === undefined) dstr = mstr; // pair with merger
  console.log(mstr, dstr);
  const demo = demos[mstr]();
  if (demo === undefined) throw new Error("merger not found");
  const draw = draws[dstr];
  if (draw === undefined) throw new Error("draw not found");

  let frame = 0;

  const step = (t = 0) => {
    draw(t / 1000, frame);
    demo.change(demo.merger, t, frame);
    demo.merger.draw();
    requestAnimationFrame(step);
  };

  step(0);

  /*
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
  */
});

glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
