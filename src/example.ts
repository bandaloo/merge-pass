import * as MP from "./index";
import * as dat from "dat.gui";
import { Merger } from "./mergepass";
import { fxaa } from "./expressions/fxaaexpr";

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

let x: CanvasRenderingContext2D;
let c: HTMLCanvasElement;
let R = (r?: any, g?: any, b?: any, a: any = 1) =>
  `rgba(${r | 0},${g | 0},${b | 0},${a})`;

interface Demos {
  [name: string]: (
    buffers?: TexImageSource[]
  ) => {
    merger: MP.Merger;
    change: (merger: MP.Merger, time: number, frame: number) => void;
  };
}

const demos: Demos = {
  edgeblur: () => {
    const merger = new MP.Merger(
      [
        MP.blur2d(
          MP.op(MP.len(MP.op(MP.ncfcoord(), "+", MP.vec2(0, 0))), "*", 3),
          MP.op(MP.len(MP.ncfcoord()), "*", 3),
          6
        ),
      ],
      sourceCanvas,
      gl
    );

    return {
      merger: merger,
      change: () => {},
    };
  },
  vectordisplay: () => {
    const merger = new MP.Merger(
      [
        MP.loop(
          [
            MP.gauss5(MP.vec2(1, 0)),
            MP.gauss5(MP.vec2(0, 1)),
            MP.brightness(0.15),
            MP.contrast(1.2),
          ],
          5
        ),
        MP.brightness(-0.5),
        MP.setcolor(MP.op(MP.fcolor(), "+", MP.input())),
      ],
      sourceCanvas,
      gl
    );

    return {
      merger: merger,
      change: () => {},
    };
  },
  singlepassgrain: () => {
    let vec: MP.BasicVec2;
    let m: MP.OpExpr<MP.Float, MP.Float>;

    const merger = new MP.Merger(
      [
        MP.gauss5(MP.vec2(0, 1)),
        MP.grain(
          (m = MP.op(
            MP.len(MP.op(MP.ncfcoord(), "+", (vec = MP.vec2(MP.mut(0), 0)))),
            "*",
            MP.mut(0.3)
          ))
        ),
      ],
      sourceCanvas,
      gl
    );

    class GrainControls {
      location: number = 0;
      strength: number = 0.3;
    }

    const controls = new GrainControls();
    const gui = new dat.GUI();
    gui.add(controls, "location", -0.5, 0.5, 0.01);
    gui.add(controls, "strength", 0, 0.5, 0.01);

    return {
      merger: merger,
      change: (merger: MP.Merger, time: number, frame: number) => {
        vec.setComp(0, controls.location);
        m.setRight(controls.strength);
      },
    };
  },
  redonly: () => {
    const merger = new MP.Merger(
      [MP.setcolor(MP.changecomp(MP.fcolor(), MP.vec2(0, 0), "gb"))],
      sourceCanvas,
      gl
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
  redzero: () => {
    const merger = new MP.Merger(
      [MP.setcolor(MP.changecomp(MP.fcolor(), 0, "r"))],
      sourceCanvas,
      gl
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
  redgreenswap: () => {
    const merger = new MP.Merger(
      [
        MP.setcolor(
          MP.changecomp(MP.fcolor(), MP.get2comp(MP.fcolor(), "gr"), "rg")
        ),
      ],
      sourceCanvas,
      gl
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
  huerotate: () => {
    let c: MP.ChangeCompExpr<MP.RGBToHSVExpr, MP.Mutable<MP.PrimitiveFloat>>;
    const merger = new MP.Merger(
      [
        MP.hsv2rgb(
          (c = MP.changecomp(MP.rgb2hsv(MP.fcolor()), MP.mut(0.5), "r", "+"))
        ),
      ],
      sourceCanvas,
      gl
    );

    class HueControls {
      hueRotation: number = 0.3;
    }

    const controls = new HueControls();
    const gui = new dat.GUI();
    gui.add(controls, "hueRotation", 0, 1.0, 0.01);

    return {
      merger: merger,
      change: () => {
        c.setNew(controls.hueRotation);
      },
    };
  },
  timehuerotate: () => {
    const merger = new MP.Merger(
      [MP.hsv2rgb(MP.changecomp(MP.rgb2hsv(MP.fcolor()), MP.time(), "r", "+"))],
      sourceCanvas,
      gl
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
  scanlines: () => {
    const merger = new MP.Merger(
      [
        MP.brightness(
          MP.op(
            MP.op(
              -1,
              "*",
              MP.pow(
                MP.cos(
                  MP.op(MP.getcomp(MP.nfcoord(), "y"), "*", (260 / 2) * Math.PI)
                ),
                6
              )
            ),
            "-",
            MP.op(
              1,
              "*",
              MP.op(
                MP.pow(MP.getcomp(MP.op(MP.ncfcoord(), "*", 2), "x"), 4),
                "+",
                MP.pow(MP.getcomp(MP.op(MP.ncfcoord(), "*", 2), "y"), 4)
              )
            )
          )
        ),
      ],
      sourceCanvas,
      gl
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
  fxaa: () => {
    const merger = new MP.Merger([MP.fxaa()], sourceCanvas, gl);
    return {
      merger: merger,
      change: () => {},
    };
  },

  bufferblur: (buffers: TexImageSource[] = []) => {
    const merger = new MP.Merger(
      [
        MP.blur2d(
          MP.getcomp(MP.buffer(0), "r"),
          MP.getcomp(MP.buffer(0), "r"),
          5
        ),
      ],
      sourceCanvas,
      gl,
      {
        buffers: buffers,
      }
    );
    return {
      merger: merger,
      change: () => {},
    };
  },

  buffereyesore: (buffers: TexImageSource[] = []) => {
    const merger = new MP.Merger(
      [
        MP.hsv2rgb(
          MP.changecomp(
            MP.rgb2hsv(MP.fcolor()),
            MP.vec2(
              MP.getcomp(MP.buffer(0), "x"),
              MP.getcomp(MP.buffer(1), "x")
            ),
            "xy",
            "+"
          )
        ),
        MP.fxaa(),
      ],
      sourceCanvas,
      gl,
      {
        buffers: buffers,
      }
    );
    return {
      merger: merger,
      change: () => {},
    };
  },
};

interface Draws {
  [name: string]: ((time: number, frames: number) => void)[];
}

// canvas drawing loops

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

const redSpiral = (t: number, frames: number) => {
  x.fillStyle = "white";
  x.fillRect(0, 0, 960, 540);
  let d;
  for (let i = 50; (i -= 0.5); ) {
    x.beginPath();
    d = 2 * C((2 + S(t / 99)) * 2 * i);
    x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i, 0, 44 / 7);
    x.fillStyle = R(i * 5);
    x.fill();
  }
};

const fabric = (t: number, frames: number) => {
  let h = 20 + C(frames / 30) * 9;
  let b = ~~(h / 8);
  for (let i = 240; i--; ) {
    x.fillStyle = `hsl(${(i ^ ~~(t * 60)) % 99},90%,${h}%)`;
    x.fillRect(4 * i, 0, 4, b);
  }
  x.drawImage(c, 1, b);
};

const shaderLike = (fillFunc: (x: number, y: number) => string) => {
  return (t: number, frames: number) => {
    for (let i = 960; i--; ) {
      x.fillStyle = fillFunc(i, frames);
      x.fillRect(i, 0, 1, 1);
    }
    x.drawImage(c, 0, 1);
  };
};

const higherOrderWaves = (color: boolean) =>
  shaderLike(
    color
      ? (x: number, y: number) => `hsl(${~~((x + y) / 20) * 100},20%,50%)`
      : (x: number, y: number) =>
          R((256 / 4) * Math.round(2 + S(x / 20) + C(y / 30)))
  );

const bitwiseGrid = () => shaderLike((x: number, y: number) => R((x & y) * 20));

const higherOrderGoo = (color: boolean) => {
  const colFunc = (i: number, ti: number) =>
    20 * ~~(1 + S(i / 20) + T(ti + S(ti + i / 99)));
  const fillFunc = color
    ? (i: number, ti: number) =>
        `hsl(${i / 9 + 99 * C(ti)},90%,${colFunc(i, ti)}%`
    : (i: number, ti: number) => R(colFunc(i, ti));
  const goo = (t: number, frames: number) => {
    let ti = frames / 60;
    for (let i = 960; i--; ) {
      x.fillStyle = fillFunc(i, ti);
      x.fillRect(i, 0, 1, 1);
    }
    x.drawImage(c, 0, 1);
  };
  return goo;
};

const vectorSpiral = (t: number, frames: number) => {
  x.fillStyle = "black";
  x.fillRect(0, 0, 960, 540);
  let d;
  x.lineWidth = 2;
  for (let i = 50; (i -= 0.5); ) {
    x.beginPath();
    x.strokeStyle = `hsl(${i * 9},50%,50%)`;
    d = 2 * C((2 + S(t / 99)) * 2 * i);
    x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i, 0, 44 / 7);
    x.stroke();
  }
};

const pinkishHelix = (t: number, frames: number) => {
  x.fillStyle = "white";
  x.fillRect(0, 0, 960, 540);
  let i, j;
  for (i = 0; i < 960; i += 32) {
    x.fillStyle = R(((1 + C(i)) / 2) * 255, 0, 155);
    for (j = 0; j < 3; j++) x.fillRect(i + j, 266 + C(i + j + t) * 50, 32, 8);
  }
};

const movingGrid = (t: number, frames: number) => {
  let i, j, s;
  c.width |= 0;
  for (i = 940; (i -= 20); )
    for (j = 520; (j -= 20); )
      (x.fillStyle = R(
        6 *
          (s =
            6 *
            (4 + C(t * 6) + C((C(t) * i) / 99 + t) + S((S(t) * j) / 99 + t))),
        0,
        s + i / 9
      )),
        x.fillRect(i, j, s, s);
};

const draws: Draws = {
  edgeblur: [redSpiral],
  vectordisplay: [vectorSpiral],
  singlepassgrain: [pinkishHelix],
  redonly: [stripes],
  redzero: [stripes],
  redgreenswap: [movingGrid],
  huerotate: [fabric],
  timehuerotate: [fabric],
  scanlines: [pinkishHelix],
  fxaa: [higherOrderGoo(true)],
  bufferblur: [higherOrderGoo(true), higherOrderGoo(false)],
  buffereyesore: [
    higherOrderWaves(true),
    higherOrderWaves(false),
    bitwiseGrid(),
  ],
};

const canvases = [sourceCanvas];
const contexts = [source];

window.addEventListener("load", () => {
  let mstr = getVariable("m");
  let dstr = getVariable("d");

  if (mstr === undefined || demos[mstr] === undefined) mstr = "edgeblur"; // default demo
  if (dstr === undefined || draws[dstr] === undefined) dstr = mstr; // pair with merger
  const draw = draws[dstr];
  if (draw === undefined) throw new Error("draw not found");

  // minus 1 because we already included the source canvas and context
  for (let i = 0; i < draw.length - 1; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("couldn't get the context of the canvas");
    }
    canvases.push(canvas);
    contexts.push(context);
    const header = document.createElement("h3");
    header.innerText = "buffer " + i;
    document.getElementById("buffers")?.appendChild(header);
    document.getElementById("buffers")?.appendChild(canvas);
  }

  const demo = demos[mstr](canvases.slice(1));
  if (demo === undefined) throw new Error("merger not found");

  (document.getElementById("title") as HTMLElement).innerText =
    "merge-pass demo: " + mstr;

  // unindent code string
  let codeStr = (" ".repeat(4) + demos[mstr])
    .split("\n")
    .map((l) => l.substr(4))
    .join("\n")
    .replace(/ /g, "&nbsp;");

  const codeElem = document.getElementById("mergercode") as HTMLElement;

  const reg = /Merger\(\[[\s\S]+\]/g;
  const matches = codeStr.match(reg);

  if (matches === null) throw new Error("matches was null");
  codeElem.innerHTML = codeStr.replace(reg, "<em>" + matches[0] + "</em>");

  // add links
  const demoNames = Object.keys(demos);

  const urls = demoNames.map(
    (d) => window.location.href.split("?")[0] + "?m=" + d
  );

  (document.getElementById("link") as HTMLAnchorElement).href =
    urls[Math.floor(Math.random() * urls.length)];

  const p = document.getElementById("demos") as HTMLParagraphElement;

  let counter = 0;
  for (const u of urls) {
    const demoLink = document.createElement("a");
    demoLink.href = u;
    demoLink.innerText = demoNames[counter];
    p.appendChild(demoLink);
    p.innerHTML += " ";
    counter++;
  }

  let frame = 0;
  const step = (t = 0) => {
    let counter = 0;
    for (const d of draw) {
      c = canvases[counter];
      x = contexts[counter];
      d(t / 1000, frame);
      counter++;
    }
    demo.change(demo.merger, t, frame);
    demo.merger.draw(t / 1000);
    requestAnimationFrame(step);
    frame++;
  };

  step(0);
});

glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
sourceCanvas.addEventListener("click", () => sourceCanvas.requestFullscreen());
