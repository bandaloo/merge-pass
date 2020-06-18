import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class RGBToHSVExpr extends ExprVec4 {
  constructor(col: Vec4) {
    super(tag`rgb2hsv(${col})`, ["uRGBCol"]);
    this.externalFuncs = [glslFuncs.rgb2hsv];
  }
}

export function rgb2hsv(col: Vec4) {
  return new RGBToHSVExpr(col);
}
