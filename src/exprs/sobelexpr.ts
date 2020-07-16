import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, SourceLists } from "./expr";

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

export function sobel(samplerNum?: number) {
  return new SobelExpr(samplerNum);
}
