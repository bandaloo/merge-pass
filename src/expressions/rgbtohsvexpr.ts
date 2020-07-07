import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

/** RGB to HSV expression */
export class RGBToHSVExpr extends ExprVec4 {
  color: Vec4;

  constructor(color: Vec4) {
    super(tag`rgb2hsv(${color})`, ["uRGBCol"]);
    this.color = color;
    this.externalFuncs = [glslFuncs.rgb2hsv];
  }

  setColor(color: Vec4) {
    this.setUniform("uRGBCol", color);
    this.color = color;
  }
}

/**
 * creates an expression that converts a color (with an alpha component) from
 * rgb to hsv
 * @param col the rgba color to convert to hsva
 */
export function rgb2hsv(col: Vec4) {
  return new RGBToHSVExpr(col);
}
