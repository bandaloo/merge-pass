import { tag, Vec2, Vec4 } from "../effect";
import { Expr } from "../effects/expression";
import { glslFuncs } from "../glslfunctions";

// adapted from https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
export class BlurExpr extends Expr<Vec4> {
  constructor(direction: Vec2) {
    super(tag`(gauss5(${direction}))`, ["uDirection"]);
    this.externalFuncs = [glslFuncs.gauss5];
  }
}
