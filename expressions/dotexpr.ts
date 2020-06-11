import { tag, Vec } from "../effect";
import { Expr } from "../effects/expression";

export class DotExpr<T extends Vec> extends Expr<T> {
  left: T;
  right: T;

  constructor(left: T, right: T) {
    super(tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }

  // TODO setters
}
