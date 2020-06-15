import { Float, Vec4 } from "../exprtypes";
import { FragColorExpr } from "./fragcolorexpr";
import { ExprVec4, tag, n2p, PrimitiveFloat } from "./expr";

export class Contrast extends ExprVec4 {
  constructor(val: Float, col: Vec4 = new FragColorExpr()) {
    super(tag`contrast(${val}, ${col})`, ["uContrast"]);
  }

  setContrast(contrast: PrimitiveFloat) {
    this.setUniform("uContrast" + this.id, n2p(contrast));
  }
}
