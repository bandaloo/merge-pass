import { ExprFloat, tag, n2e, PrimitiveFloat } from "./expr";
import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

/** true depth expression */
export class TrueDepthExpr extends ExprFloat {
  depth: Float;

  constructor(depth: PrimitiveFloat) {
    super(tag`truedepth(${depth})`, ["uDist"]);
    this.depth = depth;
    this.externalFuncs = [glslFuncs.truedepth];
  }

  /** sets the distance to convert to the true depth */
  setDist(depth: PrimitiveFloat | number) {
    this.setUniform("uDist", depth);
    this.depth = n2e(depth);
  }
}

/** calculates the linear depth from inverse depth value `1 / distance` */
export function truedepth(depth: Float | number) {
  return new TrueDepthExpr(n2e(depth));
}
