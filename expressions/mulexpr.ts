import { Expr, parse, BuildInfo } from "../effects/expression";
import { Float } from "../effect";

export class MulExpr extends Expr<Float> {
  left: Float;
  right: Float;

  constructor(left: Float, right: Float) {
    super();
    this.left = left;
    this.right = right;
  }

  parse(bi: BuildInfo): string {
    return `(${parse(this.left, "uLeftMul" + this.idStr, this, bi)} * ${parse(
      this.right,
      "uRightMul" + this.idStr,
      this,
      bi
    )})`;
  }
}
