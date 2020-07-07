import { ExprFloat, tag, n2e } from "./expr";
import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

/** true depth expression */
export class TrueDepthExpr extends ExprFloat {
  depth: Float;

  constructor(depth: Float) {
    super(tag`truedepth(${depth})`, ["uDist"]);
    this.depth = depth;
    this.externalFuncs = [glslFuncs.truedepth];
  }

  /** sets the distance to convert to the true depth */
  setDist(depth: Float | number) {
    this.setUniform("uDist", depth);
    this.depth = n2e(depth);
  }
}

/** calculates the linear depth from hyperbolic depth value `1 / distance` */
export function truedepth(depth: Float | number) {
  return new TrueDepthExpr(n2e(depth));
}
