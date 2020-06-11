import { Float, tag } from "../effect";
import { Expr } from "../effects/expression";

export class MulExpr extends Expr<Float> {
  left: Float;
  right: Float;

  constructor(left: Float, right: Float) {
    super(tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }
}
