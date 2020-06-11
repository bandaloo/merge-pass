import { Expr } from "../effects/expression";
import { Vec4, tag } from "../effect";

export class FragColorExpr extends Expr<Vec4> {
  constructor() {
    super(tag`(gl_FragColor)`, []);
  }
}
