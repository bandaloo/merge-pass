import { Float } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { buffer } from "./buffersampleexpr";
import { pfloat, n2e, mut } from "./expr";
import { gaussian, GaussianExpr } from "./gaussianexpr";
import { getcomp } from "./getcompexpr";
import { op } from "./opexpr";
import { pow } from "./powexpr";
import { vec2 } from "./vecexprs";

export class DoFLoop extends EffectLoop {
  gaussian: GaussianExpr;
  constructor(
    depth: Float = mut(pfloat(0.3)),
    rad: Float = mut(pfloat(0.01)),
    reps = 2,
    bufferNum = 0
  ) {
    let guassianExpr = gaussian(getcomp(buffer(bufferNum), "r"), depth, rad);
    // TODO should 13 be the default taps?
    const side = gauss(vec2(pow(op(1, "-", guassianExpr), 4), 0), 13);
    const up = gauss(vec2(0, pow(op(1, "-", guassianExpr), 4)), 13);
    super([side, up], { num: reps });
    this.gaussian = guassianExpr;
  }

  setDepth(depth: number) {
    // this translates the gaussian curve to the side
    this.gaussian.setA(depth);
  }

  setRadius(radius: number) {
    // this scales the gaussian curve to focus on a larger band of depth
    this.gaussian.setB(radius);
  }
}

export function dof(
  depth?: Float | number,
  rad?: Float | number,
  reps?: number,
  bufferNum?: number
) {
  return new DoFLoop(
    depth === undefined ? undefined : n2e(depth),
    rad === undefined ? undefined : n2e(rad),
    reps,
    bufferNum
  );
}
