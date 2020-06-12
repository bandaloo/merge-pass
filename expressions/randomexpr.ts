import { Expr, tag } from "../effects/expression";
import { Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class RandomExpr extends Expr<Vec4> {
  constructor() {
    super(tag`(random(gl_FragCoord.xy))`, []);
    this.externalFuncs = [glslFuncs.random];
  }
}
