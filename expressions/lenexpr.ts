import { Float, Vec } from "../exprtypes";
import { Expr, tag } from "../effects/expression";

export class LenExpr extends Expr<Float> {
  vec: Vec;

  constructor(vec: Vec) {
    super(tag`(length(${vec}))`, ["uVec"]);
    this.vec = vec;
  }
}
