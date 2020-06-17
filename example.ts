import * as MP from "./index";
import { ssample } from "./expressions/scenesampleexpr";

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
const T = Math.tan;

const x = source;
const c = sourceCanvas;
let R = (r?: any, g?: any, b?: any, a: any = 1) =>
  `rgba(${r | 0},${g | 0},${b | 0},${a})`;

interface Demos {
  [name: string]: () => {
    merger: MP.Merger;
    change: (merger: MP.Merger, time: number, frame: number) => void;
  };
}

const demos: Demos = {
  edgeblur: () => {
    const merger = new MP.Merger(
      [
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
  vectordisplay: () => {
    const merger = new MP.Merger(
      [
        MP.blur2d(1, 1, 2),
        MP.brightness(-0.3),
        //MP.setcolor(MP.add(MP.fcolor(), ssample())),
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

const stripes = (t: number, frames: number) => {
  if (frames === 0) {
    x.fillStyle = "black";
    x.fillRect(0, 0, 960, 540);
    x.font = "99px monospace";
    x.fillStyle = "white";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("hello world", 960 / 2, 540 / 4);
  }
  const i = ~~(frames / 9);
  const j = ~~(i / 44);
  const k = i % 44;
  x.fillStyle = `hsl(${(k & j) * i},40%,${50 + C(i) * 10}%`;
  x.fillRect(k * 24, 0, 24, k + 2);
  x.drawImage(c, 0, k + 2);
};

// canvas drawing loops

// TODO deobfuscate these more

const spiral = (t: number, frames: number) => {
  let d;
  c.width |= 0;
  for (let i = 50; (i -= 0.5); )
    x.beginPath(),
      (d = 2 * C((2 + S(t / 99)) * 2 * i)),
      x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i, 0, 44 / 7),
      (x.fillStyle = R(i * 5)),
      x.fill();
};

const vectorSpiral = (t: number, frames: number) => {
  x.fillStyle = "black";
  x.fillRect(0, 0, 960, 540);
  let d;
  x.lineWidth = 5;
  x.strokeStyle = "white";
  for (let i = 50; (i -= 0.5); )
    x.beginPath(),
      (d = 2 * C((2 + S(t / 99)) * 2 * i)),
      x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i, 0, 44 / 7),
      x.stroke();
};

const draws: Draws = {
  edgeblur: spiral,
  vectordisplay: vectorSpiral,
};

window.addEventListener("load", () => {
  let mstr = getVariable("m");
  let dstr = getVariable("d");

  console.log(mstr, dstr);
  if (mstr === undefined || demos[mstr] === undefined) mstr = "edgeblur"; // default demo
  if (dstr === undefined || draws[dstr] === undefined) dstr = mstr; // pair with merger
  console.log(mstr, dstr);
  const demo = demos[mstr]();
  if (demo === undefined) throw new Error("merger not found");
  const draw = draws[dstr];
  if (draw === undefined) throw new Error("draw not found");

  (document.getElementById("title") as HTMLElement).innerText = "demo: " + mstr;
  (document.getElementById("mergercode") as HTMLElement).innerText =
    "" + demos[mstr];

  let frame = 0;

  x.save();
  const step = (t = 0) => {
    draw(t / 1000, frame);
    demo.change(demo.merger, t, frame);
    demo.merger.draw();
    requestAnimationFrame(step);
    frame++;
  };
  x.restore();

  step(0);
});

glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
