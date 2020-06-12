import { Vec2, Vec4 } from "../exprtypes";
import { Expr, tag } from "../effects/expression";
import { glslFuncs } from "../glslfunctions";

export class BlurExpr extends Expr<Vec4> {
  constructor(direction: Vec2) {
    super(tag`(gauss5(${direction}))`, ["uDirection"]);
    this.externalFuncs = [glslFuncs.gauss5];
  }
}
