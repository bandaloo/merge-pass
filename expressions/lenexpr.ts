import { Expr, parse } from "../effects/expression";
import { Float, Vec } from "../effect";

export class LenExpr extends Expr<Float> {
  vec: Vec;

  constructor(vec: Vec) {
    super();
    this.vec = vec;
  }

  parse(): string {
    return `(length(${parse(this.vec, "uVecLen", this)}))`;
  }
}
