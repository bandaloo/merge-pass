import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, SourceLists, cvec4, tag } from "./expr";
import { brightness } from "./brightnessexpr";
import { op } from "./opexpr";
import { getcomp } from "./getcompexpr";
import { invert } from "./invertexpr";
import { monochrome } from "./monochromeexpr";
import { Vec4 } from "../exprtypes";
import { fcolor } from "./fragcolorexpr";

/** @ignore */
function genSobelSource(samplerNum?: number): SourceLists {
  return {
    sections: [`sobel${samplerNum === undefined ? "" : "_" + samplerNum}()`],
    values: [],
  };
}

/** sobel expression */
export class SobelExpr extends ExprVec4 {
  constructor(samplerNum?: number) {
    super(genSobelSource(samplerNum), []);
    if (samplerNum === undefined) {
      this.needs.neighborSample = true;
      this.externalFuncs = [glslFuncs.sobel];
    } else {
      this.needs.extraBuffers = new Set([samplerNum]);
      this.externalFuncs = [
        replaceSampler(glslFuncs.sobel, /vec4\ssobel[0-9]+/g, samplerNum),
      ];
    }
  }
}

// TODO test sampler num
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

/*
export function edgecolor(color: Vec4, samplerNum?: number) {
  return cvec4(
    tag`mix(${fcolor()}, ${color}, ${monochrome(sobel(samplerNum))})`
  );
  //getcomp(monochrome(sobel(samplerNum)), "r");
}
*/
