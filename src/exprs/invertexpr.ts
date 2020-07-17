import { ExprVec4, tag, PrimitiveVec4 } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

/** invert expression */
export class InvertExpr extends ExprVec4 {
  color: Vec4;

  constructor(color: Vec4) {
    super(tag`invert(${color})`, ["uColor"]);
    this.externalFuncs = [glslFuncs.invert];
    this.color = color;
  }

  /** sets the color */
  setColor(color: PrimitiveVec4) {
    this.setUniform("uColor", color);
    this.color = color;
  }
}

/**
 * creates an expression that inverts the color, keeping the original alpha
 */
export function invert(col: Vec4) {
  return new InvertExpr(col);
}
