import { Float } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { channel } from "./buffersampleexpr";
import { pfloat, n2e, mut } from "./expr";
import { gaussian, GaussianExpr } from "./gaussianexpr";
import { getcomp } from "./getcompexpr";
import { op } from "./opexpr";
import { a2 } from "./arity2";
import { vec2 } from "./vecexprs";

export class DoFLoop extends EffectLoop {
  gaussian: GaussianExpr;

  constructor(
    depth: Float = mut(pfloat(0.3)),
    rad: Float = mut(pfloat(0.01)),
    depthInfo: Float = getcomp(channel(0), "r"),
    reps = 2
  ) {
    let guassianExpr = gaussian(depthInfo, depth, rad);
    // TODO optional taps number
    const side = gauss(vec2(a2("pow", op(1, "-", guassianExpr), 4), 0), 13);
    const up = gauss(vec2(0, a2("pow", op(1, "-", guassianExpr), 4)), 13);
    super([side, up], { num: reps });
    this.gaussian = guassianExpr;
  }

  setDepth(depth: Float | number) {
    // this translates the gaussian curve to the side
    this.gaussian.setA(depth);
  }

  setRadius(radius: Float | number) {
    // this scales the gaussian curve to focus on a larger band of depth
    this.gaussian.setB(radius);
  }
}

/**
 * depth of field effect
 * @param depth float for what inverse depth to focus on (1 on top of the
 * camera; 0 is infinity)
 * @param rad float for how deep the band of in-focus geometry is (a value
 * between 0.01 and 0.1 is reasonable)
 * @param depthInfo float the expression that represents
 * @param reps
 */
export function dof(
  depth?: Float | number,
  rad?: Float | number,
  depthInfo?: Float | number,
  reps?: number
) {
  return new DoFLoop(n2e(depth), n2e(rad), n2e(depthInfo), reps);
}
