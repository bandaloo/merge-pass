import { ExprVec4, tag, PrimitiveVec4 } from "./expr";
import { glslFuncs } from "../glslfunctions";
import { Vec4 } from "../exprtypes";

/** monochrome expression */
export class MonochromeExpr extends ExprVec4 {
  color: Vec4;

  constructor(color: Vec4) {
    super(tag`monochrome(${color})`, ["uColor"]);
    this.externalFuncs = [glslFuncs.monochrome];
    this.color = color;
  }

  /** sets the color */
  setColor(color: PrimitiveVec4) {
    this.setUniform("uColor", color);
    this.color = color;
  }
}

/**
 * creates an expression that converts a color into grayscale, keeping the
 * original alpha
 */
export function monochrome(col: Vec4) {
  return new MonochromeExpr(col);
}
