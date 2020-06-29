import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class HSVToRGBExpr extends ExprVec4 {
  constructor(col: Vec4) {
    super(tag`hsv2rgb(${col})`, ["uHSVCol"]);
    this.externalFuncs = [glslFuncs.hsv2rgb];
  }

  setColor(col: Vec4 | number) {
    this.setUniform("uHSVCol", col);
  }
}

export function hsv2rgb(col: Vec4) {
  return new HSVToRGBExpr(col);
}
