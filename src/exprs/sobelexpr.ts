import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag } from "./expr";

/** Sobel edge detection expression */
export class SobelExpr extends ExprVec4 {
  constructor(samplerNum?: number) {
    super(tag`sobel()`, []);
    this.externalFuncs = [glslFuncs.sobel];
    this.brandExprWithChannel(0, samplerNum);
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
