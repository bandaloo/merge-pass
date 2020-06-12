import { Expr, tag } from "../effects/expression";
import { Float, RawFloat, Vec4 } from "../exprtypes";
import { FragColorExpr } from "./fragcolorexpr";

export class Contrast extends Expr<Vec4> {
  constructor(val: Float, col: Vec4 = new FragColorExpr()) {
    super(tag`contrast(${val}, ${col})`, ["uContrast"]);
  }

  setContrast(contrast: RawFloat) {
    this.setUniform("uContrast" + this.id, contrast);
  }
}
