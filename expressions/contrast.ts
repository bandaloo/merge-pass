import { Float, RawFloat, Vec4 } from "../exprtypes";
import { FragColorExpr } from "./fragcolorexpr";
import { ExprVec4, tag } from "./expr";

export class Contrast extends ExprVec4 {
  constructor(val: Float, col: Vec4 = new FragColorExpr()) {
    super(tag`contrast(${val}, ${col})`, ["uContrast"]);
  }

  setContrast(contrast: RawFloat) {
    this.setUniform("uContrast" + this.id, contrast);
  }
}
