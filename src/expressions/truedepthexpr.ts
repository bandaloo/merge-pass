import { ExprFloat, tag, n2e } from "./expr";
import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

export class TrueDepthExpr extends ExprFloat {
  constructor(dist: Float) {
    super(tag`truedepth(${dist})`, ["uDist"]);
    this.externalFuncs = [glslFuncs.truedepth];
  }

  setDist(dist: Float | number) {
    this.setUniform("uDist", n2e(dist));
  }
}

export function truedepth(dist: Float | number) {
  return new TrueDepthExpr(n2e(dist));
}
