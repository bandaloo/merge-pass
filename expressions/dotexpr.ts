import { Expr, parse, BuildInfo } from "../effects/expression";
import { Effect, Vec } from "../effect";

export class DotExpr<T extends Vec> extends Expr<T> {
  left: T;
  right: T;

  constructor(left: T, right: T) {
    super();
    this.left = left;
    this.right = right;
  }

  parse(bi: BuildInfo) {
    // TODO prettier formatting here sucks so much
    return `(${parse(this.left, "uLeft" + this.idStr, this, bi)} * ${parse(
      this.right,
      "uRight" + this.idStr,
      this,
      bi
    )})`;
  }
}
