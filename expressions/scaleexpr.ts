import { Expr, parse, BuildInfo } from "../effects/expression";
import { Float, Vec, Effect } from "../effect";

export class ScaleExpr extends Expr<Float> {
  scalar: Float;
  vec: Vec;

  constructor(scalar: Float, vec: Vec) {
    super();
    this.scalar = scalar;
    this.vec = vec;
  }

  parse(bi: BuildInfo): string {
    return `(${parse(
      this.scalar,
      "uScalarScale" + this.idStr,
      this,
      bi
    )} * ${parse(this.vec, "uVecScale" + this.idStr, this, bi)})`;
  }
}
