import * as dat from "dat.gui";
import * as MP from "./index";

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const gl = glCanvas.getContext("webgl2");

const mousePos = { x: 0, y: 0 };

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
    channels?: TexImageSource[]
  ) => {
    merger: MP.Merger;
    change: (merger: MP.Merger, time: number, frame: number) => void;
  };
}

const demos: Demos = {
  edgeblur: () => {
    const lenExpr = MP.op(MP.len(MP.ncfcoord()), "*", 3);
    const merger = new MP.Merger(
      [MP.blur2d(lenExpr, lenExpr, 3)],
      sourceCanvas,
      gl
    );

    return {
      merger: merger,
      change: () => {},
    };
  },

  bluramount: () => {
    const fl = MP.float(MP.mut(1));
    const merger = new MP.Merger([MP.blur2d(fl, fl)], sourceCanvas, gl);

    class BlurControls {
      blur: number = 1;
    }

    const controls = new BlurControls();
    const gui = new dat.GUI();
    gui.add(controls, "blur", 0, 1, 0.01);

    return {
      merger: merger,
      change: () => {
        fl.setVal(controls.blur);
      },
    };
  },

  bluramountnamed: () => {
    const fl = MP.float(MP.mut(1, "uCustomName"));
    const merger = new MP.Merger([MP.blur2d(fl, fl)], sourceCanvas, gl);

    class BlurControls {
      blur: number = 1;
    }

    const controls = new BlurControls();
    const gui = new dat.GUI();
    gui.add(controls, "blur", 0, 1, 0.01);

    return {
      merger: merger,
      change: () => {
        fl.setUniform("uCustomName", controls.blur);
      },
    };
  },

  vectordisplay: () => {
    const merger = new MP.Merger(
      [
        MP.loop(
          [
            MP.gauss(MP.vec2(1, 0)),
            MP.gauss(MP.vec2(0, 1)),
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
        MP.gauss(MP.vec2(0, 1), 13),
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
        vec.setComp(0, -controls.location);
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
              MP.a2(
                "pow",
                MP.a1(
                  "cos",
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
                MP.a2("pow", MP.getcomp(MP.op(MP.ncfcoord(), "*", 2), "x"), 4),
                "+",
                MP.a2("pow", MP.getcomp(MP.op(MP.ncfcoord(), "*", 2), "y"), 4)
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

  channelblur: (channels: TexImageSource[] = []) => {
    // TODO get rid of this
    const a = MP.a1("sin", 1);
    const merger = new MP.Merger(
      [
        MP.hsv2rgb(
          MP.changecomp(
            MP.rgb2hsv(MP.fcolor()),
            MP.getcomp(MP.gauss(MP.vec2(8, 0), 13, 0), "r"),
            "z"
          )
        ),
      ],
      sourceCanvas,
      gl,
      {
        channels: channels,
      }
    );
    return {
      merger: merger,
      change: () => {},
    };
  },

  channeleyesore: (channels: TexImageSource[] = []) => {
    const merger = new MP.Merger(
      [
        MP.hsv2rgb(
          MP.changecomp(
            MP.rgb2hsv(MP.fcolor()),
            MP.vec2(
              MP.getcomp(MP.channel(0), "x"),
              MP.getcomp(MP.channel(1), "x")
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
        channels: channels,
      }
    );
    return {
      merger: merger,
      change: () => {},
    };
  },

  basicdof: (channels: TexImageSource[] = []) => {
    //const dof = MP.dof(MP.mut(0.3), MP.mut(0.01));
    const dof = MP.dof();
    const merger = new MP.Merger([dof], sourceCanvas, gl, {
      channels: channels,
    });

    class FocusControls {
      focus: number = 0.3;
      radius: number = 0.01;
    }

    const controls = new FocusControls();
    const gui = new dat.GUI();

    gui.add(controls, "focus", 0, 1.0, 0.01);
    gui.add(controls, "radius", 0.01, 0.1, 0.01);

    return {
      merger: merger,
      change: () => {
        dof.setDepth(controls.focus);
        dof.setRadius(controls.radius);
      },
    };
  },

  lineardof: (channels: TexImageSource[] = []) => {
    const dof = MP.dof(
      // transform a linear depth buffer to hyperbolic where 12 is max depth
      MP.mut(0.3),
      MP.mut(0.01),
      MP.op(
        1,
        "/",
        MP.op(
          1,
          "+",
          MP.op(12, "*", MP.op(1, "-", MP.getcomp(MP.channel(0), "r")))
        )
      )
    );

    const merger = new MP.Merger([dof], sourceCanvas, gl, {
      channels: channels,
    });

    class FocusControls {
      focus: number = 0;
      radius: number = 0.01;
    }

    const controls = new FocusControls();
    const gui = new dat.GUI();

    gui.add(controls, "focus", 0, 1.0, 0.01);
    gui.add(controls, "radius", 0.01, 0.1, 0.01);

    return {
      merger: merger,
      change: () => {
        dof.setDepth(controls.focus);
        dof.setRadius(controls.radius);
      },
    };
  },

  lightbands: (channels: TexImageSource[] = []) => {
    const merger = new MP.Merger(
      [
        MP.brightness(
          MP.a1(
            "cos",
            MP.op(MP.time(), "+", MP.truedepth(MP.getcomp(MP.channel(0), "r")))
          )
        ),
      ],
      sourceCanvas,
      gl,
      {
        channels: channels,
      }
    );
    return {
      merger: merger,
      change: () => {},
    };
  },

  depthgodrays: (channels: TexImageSource[] = []) => {
    let godrays: MP.GodRaysExpr;
    const merger = new MP.Merger(
      [
        (godrays = MP.godrays({
          convertDepth: {
            threshold: 0.1,
            newColor: MP.hsv2rgb(
              MP.vec4(MP.op(MP.time(), "/", 4), 0.5, 0.5, 1)
            ),
          },
        })),
      ],
      sourceCanvas,
      gl,
      {
        channels: channels,
      }
    );

    class LocationControls {
      location = 0;
      exposure = 1.0;
      decay = 1.0;
      density = 1.0;
      weight = 0.01;
    }

    const controls = new LocationControls();
    const gui = new dat.GUI();
    gui.add(controls, "location", -1, 1, 0.01);
    gui.add(controls, "exposure", 0, 1, 0.01);
    gui.add(controls, "decay", 0.9, 1, 0.001);
    gui.add(controls, "density", 0, 1, 0.01);
    gui.add(controls, "weight", 0, 0.02, 0.001);

    return {
      merger: merger,
      change: () => {
        godrays.setLightPos(MP.pvec2(0.5 + -controls.location / 5, 0.5));
        godrays.setExposure(controls.exposure);
        godrays.setDecay(controls.decay);
        godrays.setDensity(controls.density);
        godrays.setWeight(controls.weight);
      },
    };
  },

  mousegodrays: (channels: TexImageSource[] = []) => {
    const merger = new MP.Merger(
      [MP.godrays({ lightPos: MP.op(MP.mouse(), "/", MP.resolution()) })],
      sourceCanvas,
      gl,
      {
        channels: channels,
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
      ? (x: number, y: number) => `hsl(${~~((x + y) / 20) * 100},50%,90%)`
      : (x: number, y: number) =>
          R((256 / 4) * Math.round(2 + S(x / 20) + C(y / 30)))
  );

const uncommonCheckerboard = shaderLike((x, y) => {
  y /= 60;
  return `hsl(${x / 9 + y * 9},40%,${
    9 + 60 * ~~((1 + C(y) + 4 * C(x / (99 + 20 * C(y / 5))) * S(y / 2)) % 2)
  }%)`;
});

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

const higherOrderPerspective = (color: boolean, normalized = true) => {
  const layerNum = 12;
  const fillFunc = color
    ? (i: number) => `hsl(${i * 99},50%,50%)`
    : (i: number) => R(255 * (normalized ? 1 / (1 + i) : i / layerNum));
  return (t: number, frames: number) => {
    x.fillStyle = !normalized ? R(255) : R(1, color, color);
    x.fillRect(0, 0, 960, 540);
    const d = (xp: number, yp: number, zp: number, w: number, h: number) => {
      x.fillRect(
        Math.round(480 + (xp - w / 2) / zp),
        Math.round(270 + (yp - h / 2) / zp),
        Math.round(w / zp),
        Math.round(h / zp)
      );
      x.fill();
    };
    const offset = 200;
    const size = 64;
    const amplitude = 32;
    for (let i = layerNum; i > 0; i -= 0.5) {
      x.fillStyle = fillFunc(i);
      const span = 14;
      const spacing = 64;
      const f = (off: number) => {
        for (let j = 0; j < span; j++) {
          d(
            (j - span / 2) * spacing + spacing / 2,
            offset * off + amplitude * C(j + frames / 60),
            i,
            size * ((span - j) / span),
            size * ((j + 1) / span)
          );
        }
      };
      f(-1);
      f(C(frames / 60));
      f(1);
    }
  };
};

const higherOrderDonuts = (color = true) => {
  const rFunc = (i: number, j: number) =>
    255 * ~~((1 + 3 * C(i / (99 + 20 * C(j / 5))) * S(j / 2)) % 2);
  const fillFunc = !color
    ? (i: number, j: number) => {
        let r = 255 - rFunc(i, j);
        return R(r, r, r);
      }
    : (i: number, j: number) => {
        let r = rFunc(i, j);
        return r > 0 ? R(r / 4) : R(0, 0, 99 * C(i / 10) * S(j / 2) + 30);
      };

  return (t: number, frames: number) => {
    if (!frames) {
      x.fillStyle = "black";
      x.fillRect(0, 0, 960, 540);
    }
    let j = frames / 60;
    for (let i = 960; i--; x.fillStyle = fillFunc(i, j)) x.fillRect(i, 0, 1, 1);
    x.drawImage(c, 0, 1);
  };
};

const draws: Draws = {
  edgeblur: [redSpiral],
  bluramount: [movingGrid],
  bluramountnamed: [movingGrid],
  vectordisplay: [vectorSpiral],
  singlepassgrain: [pinkishHelix],
  redonly: [stripes],
  redzero: [stripes],
  redgreenswap: [movingGrid],
  huerotate: [fabric],
  timehuerotate: [uncommonCheckerboard],
  scanlines: [pinkishHelix],
  fxaa: [higherOrderGoo(true)],
  channelblur: [higherOrderGoo(true), higherOrderGoo(false)],
  channeleyesore: [
    higherOrderWaves(true),
    higherOrderWaves(false),
    bitwiseGrid(),
  ],
  basicdof: [higherOrderPerspective(true), higherOrderPerspective(false)],
  lineardof: [
    higherOrderPerspective(true),
    higherOrderPerspective(false, false),
  ],
  lightbands: [higherOrderPerspective(true), higherOrderPerspective(false)],
  depthgodrays: [higherOrderPerspective(true), higherOrderPerspective(false)],
  mousegodrays: [higherOrderDonuts(true), higherOrderDonuts(false)],
};

interface Notes {
  [name: string]: string;
}

const notes: Notes = {
  edgeblur:
    "the blur radius is a function of distance from the center coordinate." +
    "this makes the image appear more in focus only around the center",
  basicdof:
    "the blue rectangles should be most in focus. you can adjust with the controls " +
    "in the corner",
  lineardof:
    "by default, <code>dof</code> assumes that the image with your depth buffer info is " +
    "stored in channel 0, and that the red channel is normalized so that 1 is right " +
    "on top of the camera lense, and 0 is all the way at infinity. this example " +
    "shows how you might transform a depth buffer that stores the absolute depth " +
    "into the form that <code>dof</code> interprets",
  channeleyesore:
    "despite this demo offering very little in the way of aesthetic value, it " +
    "demonstrates how you can optionally pass a list of images (which can " +
    "be canvases or videos) into the merger constructor and sample from them",
  fxaa:
    "fxaa stands for fast approximate anti-aliasing. amazingly, it only needs " +
    "the scene buffer info. it's not perfect, but it does the job in many cases. you " +
    "can see how it eliminates jaggies by looking at the unprocessed image",
  scanlines:
    "you can use trigonometric functions and exponents to create masks " +
    "with interesting shapes",
  huerotate:
    "you can use <code>rgb2hsv</code> and <code>hsv2rgb</code> and " +
    "<code>changecomp</code> to change the hue, saturation or value of a color",
  timehuerotate:
    "<code>time</code> will insert the time uniform into the generated code." +
    "update time by passing in the current time to <code>merger.draw</code> in " +
    "your draw loop",
  redgreenswap:
    "you change only a few components of a vector in line with " +
    "<code>get2comp</code>. using this in conjunction with <code>change2comp</code> " +
    'you can sort of <a href="https://en.wikipedia.org/wiki/Swizzling_(computer_graphics)">swizzle</a>',
  singlepassgrain:
    "even though a vertical blur is used, only one pass is needed here." +
    "because of this, only one shader pass is generated (check the console) since " +
    "since the additional grain effect can run directly afterwards in the same shader",
  bluramount:
    "even though the blur effect is split up among multiple shaders, you update " +
    "a uniform in both shaders by changing only a single mutable. " +
    "the float expression <code>fl</code> gets passed in as both the " +
    "horizontal and vertical radii of <code>blur2dloop</code>. <code>fl</code> " +
    "contains a mutable primitive float which we can change with <code>fl.setVal</code>. " +
    "(also, because the same expression can appear in the effect tree multiple " +
    "times, and expressions can contain expressions, you can make reference loops, " +
    "so don't do that)",
  bluramountnamed:
    "instead of using member functions on an expression to change a mutable value, you can " +
    'give a mutable in an expression a custom name with <code>fl = MP.float(MP.mut(1, "uCustomName"))</code> ' +
    'and do <code>fl.setUniform("uCustomName", 1.0)</code> ' +
    "instead of <code>fl.setVal(1.0)</code>. honestly, the latter is easier but you have " +
    "the option! and, giving a mutable a custom name does not prevent you from using " +
    "<code>setVal</code>",
  vectordisplay:
    "this glowing vector effect is created by repeatedly bluring and increasing the " +
    "contrast of the original scene. then the fragment color of the original " +
    "scene (accessed with <code>input</code>) is added on top of the blurred " +
    "image",
  channelblur:
    "you can use <code>gauss</code> on an extra channel instead of " +
    "the scene channel by passing in an optional argument",
  lightbands:
    "even though the value in the depth buffer is actually 1 / (1 + depth), we can " +
    "calculate the true depth value with <code>truedepth</code>. with this, we can colorize" +
    "bands of depth in our scene all the way out to infinity",
  depthgodrays:
    "<code>godrays</code> can also be made to read depth buffer info " +
    "instead of an occlusion buffer. as the final argument, you must specify an " +
    "object that has a <code>threshold</code> " +
    "(all depth values lower than this are not occluded) and a <code>newColor</code> " +
    "which denotes what color the shining light should be",
  mousegodrays:
    "the <code>godrays</code> effect requires an occlusion buffer. black pixels denote the silhouette " +
    "of the geometry and the white (or any color) pixels denote the light shining behind. " +
    "move the mouse around to change the light position of the light source! you can get the mouse " +
    "position with <code>MP.mouse()</code> and the resolution with <code>MP.resolution()</code>. " +
    "if you are using mouse input, pass the x and y position (in pixels) of the mouse in as the " +
    "second and third arguments like this: <code>merger.draw(time, mouseX, mouseY)</code>.",
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

  const note = notes[mstr];
  if (note !== undefined) {
    const div = document.getElementById("note");
    const title = document.createElement("h2");
    const p = document.createElement("p");
    title.innerText = "note";
    p.innerHTML = note;
    if (div === null) throw new Error("notes div was undefined");
    div.appendChild(title);
    div.appendChild(p);
  }

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
    header.innerText = "channel " + i;
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
    demo.merger.draw(t / 1000, mousePos.x, mousePos.y);
    requestAnimationFrame(step);
    frame++;
  };

  step(0);
});

glCanvas.addEventListener("click", () => glCanvas.requestFullscreen());
glCanvas.addEventListener("mousemove", (e) => {
  const rect = glCanvas.getBoundingClientRect();
  mousePos.x = (960 * (e.clientX - rect.left)) / rect.width;
  mousePos.y = (540 * (rect.height - (e.clientY - rect.top))) / rect.height;
  console.log(rect.width);
});
sourceCanvas.addEventListener("click", () => sourceCanvas.requestFullscreen());
