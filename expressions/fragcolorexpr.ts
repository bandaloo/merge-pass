import { Expr, tag } from "../effects/expression";
import { Vec4 } from "../exprtypes";

export class FragColorExpr extends Expr<Vec4> {
  constructor() {
    super(tag`(gl_FragColor)`, []);
  }
}
