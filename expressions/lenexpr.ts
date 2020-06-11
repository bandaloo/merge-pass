import { Expr, parse, BuildInfo } from "../effects/expression";
import { Float, Vec } from "../effect";

export class LenExpr extends Expr<Float> {
  vec: Vec;

  constructor(vec: Vec) {
    super();
    this.vec = vec;
  }

  parse(bi: BuildInfo): string {
    return `(length(${parse(this.vec, "uVecLen" + this.idStr, this, bi)}))`;
  }
}
