import { ExprFloat, tag, n2e } from "./expr";
import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class TrueDepthExpr extends ExprFloat {
  depth: Float;

  constructor(depth: Float) {
    super(tag`truedepth(${depth})`, ["uDist"]);
    this.depth = depth;
    this.externalFuncs = [glslFuncs.truedepth];
  }

  setDist(depth: Float | number) {
    this.setUniform("uDist", depth);
    this.depth = n2e(depth);
  }
}

export function truedepth(depth: Float | number) {
  return new TrueDepthExpr(n2e(depth));
}
