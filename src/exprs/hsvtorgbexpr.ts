import { ExprVec4, tag, PrimitiveVec4 } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

/** HSV to RGB expression */
export class HSVToRGBExpr extends ExprVec4 {
  color: Vec4;

  constructor(color: Vec4) {
    super(tag`hsv2rgb(${color})`, ["uHSVCol"]);
    this.color = color;
    this.externalFuncs = [glslFuncs.hsv2rgb];
  }

  /** sets the color to convert */
  setColor(color: PrimitiveVec4) {
    this.setUniform("uHSVCol", color);
    this.color = color;
  }
}

/**
 * converts a color (with an alpha compoment) from hsv to rgb
 * @param col the hsva color to convert to rgba
 */
export function hsv2rgb(col: Vec4) {
  return new HSVToRGBExpr(col);
}
