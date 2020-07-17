import { ExprVec4, tag } from "./expr";
import { glslFuncs } from "../glslfunctions";
import { Vec4 } from "../exprtypes";

/** monochrome expression */
export class MonochromeExpr extends ExprVec4 {
  constructor(color: Vec4) {
    super(tag`monochrome(${color})`, ["uColor"]);
    this.externalFuncs = [glslFuncs.monochrome];
  }
}

/**
 * creates an expression that converts a color into grayscale, keeping the
 * original alpha
 */
export function monochrome(col: Vec4) {
  return new MonochromeExpr(col);
}
