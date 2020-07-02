import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class HSVToRGBExpr extends ExprVec4 {
  color: Vec4;

  constructor(color: Vec4) {
    super(tag`hsv2rgb(${color})`, ["uHSVCol"]);
    this.color = color;
    this.externalFuncs = [glslFuncs.hsv2rgb];
  }

  setColor(color: Vec4) {
    this.setUniform("uHSVCol", color);
    this.color = color;
  }
}

export function hsv2rgb(col: Vec4) {
  return new HSVToRGBExpr(col);
}
