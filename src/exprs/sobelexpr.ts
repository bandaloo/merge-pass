import { glslFuncs } from "../glslfunctions";
import { ExprVec4, SourceLists } from "./expr";
import { replaceSampler } from "../utils";

/** @ignore */
function genSobelSource(samplerNum?: number): SourceLists {
  return {
    sections: [`sobel${samplerNum === undefined ? "" : "_" + samplerNum}()`],
    values: [],
  };
}

/** Sobel edge detection expression */
export class SobelExpr extends ExprVec4 {
  constructor(samplerNum?: number) {
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

/**
 * creates a Sobel edge detection expression that outputs the raw result; for
 * more highly processed edge detection expressions, see [[edgecolor]] or
 * [[edge]]
 * @param samplerNum where to sample from
 */
export function sobel(samplerNum?: number) {
  return new SobelExpr(samplerNum);
}
