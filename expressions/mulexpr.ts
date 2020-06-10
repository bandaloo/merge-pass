import { Expr, parse } from "../effects/expression";
import { Float } from "../effect";

export class MulExpr extends Expr<Float> {
  left: Float;
  right: Float;

  constructor(left: Float, right: Float) {
    super();
    this.left = left;
    this.right = right;
  }

  parse(): string {
    return `(${parse(this.left, "uLeftMul", this)} * ${parse(
      this.right,
      "uRightMul",
      this
    )})`;
  }
}
