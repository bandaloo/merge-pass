import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, SourceLists, cvec4, tag } from "./expr";
import { brightness } from "./brightnessexpr";
import { op } from "./opexpr";
import { getcomp } from "./getcompexpr";
import { invert } from "./invertexpr";
import { monochrome } from "./monochromeexpr";
import { Vec4 } from "../exprtypes";
import { fcolor } from "./fragcolorexpr";
import { a2 } from "./arity2";
import { vec4 } from "./vecexprs";

/** @ignore */
function genSobelSource(samplerNum?: number): SourceLists {
  return {
    sections: [`sobel${samplerNum === undefined ? "" : "_" + samplerNum}()`],
    values: [],
  };
}

/** Sobel expression */
export class SobelExpr extends ExprVec4 {
  constructor(samplerNum?: number) {
    console.log(samplerNum);
    super(genSobelSource(samplerNum), []);
    if (samplerNum === undefined) {
      this.needs.neighborSample = true;
      this.externalFuncs = [glslFuncs.sobel];
    } else {
      this.needs.extraBuffers = new Set([samplerNum]);
      this.externalFuncs = [
        replaceSampler(glslFuncs.sobel, /vec4\ssobel+/, samplerNum),
      ];
    }
    this.needs.neighborSample = true;
  }
}

// TODO test sampler num
/** creates Sobel edge detection expression */
export function sobel(samplerNum?: number) {
  return new SobelExpr(samplerNum);
}

/**
 * returns an expression highlights edges where they appear
 * @param style `"dark"` for dark edges and `"light"` for light edges, or a
 * custom number (between -1 and 1) for a more gray style of edge
 * @param samplerNum where to sample from
 */
export function edge(
  style: "dark" | "light" | number = "dark",
  samplerNum?: number
) {
  const mult = style === "dark" ? -1 : style === "light" ? 1 : style;
  return brightness(
    op(getcomp(invert(monochrome(sobel(samplerNum))), "r"), "*", mult)
  );
}

/** returns an expression that colors the egde */
export function edgecolor(color: Vec4, samplerNum?: number) {
  return cvec4(
    tag`mix(${color}, ${fcolor()}, ${monochrome(
      a2("step", vec4(0.5, 0.5, 0.5, 0.0), sobel(samplerNum))
    )})`
  );
  // use this instead to do without the step
  //tag`mix(${color}, ${fcolor()}, ${monochrome(sobel(samplerNum))})`
}
