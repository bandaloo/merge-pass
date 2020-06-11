import { Expr } from "../effects/expression";
import { tag, Float, Vec4, RawFloat } from "../effect";
import { FragColorExpr } from "./fragcolorexpr";

export class Contrast extends Expr<Vec4> {
  constructor(val: Float, col: Vec4 = new FragColorExpr()) {
    super(tag`contrast(${val}, ${col})`, ["uContrast"]);
  }

  setContrast(contrast: RawFloat) {
    this.setUniform("uContrast" + this.id, contrast);
  }
}
