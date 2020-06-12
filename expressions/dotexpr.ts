import { Vec } from "../exprtypes";
import { Expr, tag } from "../effects/expression";

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
