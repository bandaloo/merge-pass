import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { mut, pfloat } from "./expr";
import { gaussian, GaussianExpr } from "./gaussianexpr";
import { op } from "./opexpr";
import { pow } from "./powexpr";
import { vec2 } from "./vecexprs";
import { buffer } from "./buffersampleexpr";
import { getcomp } from "./getcompexpr";

export class DoFLoop extends EffectLoop {
  gaussianSide: GaussianExpr;
  gaussianUp: GaussianExpr;
  constructor(depth: number, reps = 2, rad = 0.01, bufferNum = 0) {
    const radSide = mut(pfloat(rad));
    const radUp = mut(pfloat(rad));
    const depthSide = mut(pfloat(depth));
    const depthUp = mut(pfloat(depth));
    let gSide = gaussian(getcomp(buffer(bufferNum), "r"), depthSide, radSide);
    let gUp = gaussian(getcomp(buffer(bufferNum), "r"), depthUp, radUp);
    const side = gauss(vec2(pow(op(1, "-", gSide), 4), 0), 13);
    const up = gauss(vec2(0, pow(op(1, "-", gUp), 4)), 13);
    super([side, up], { num: reps });
    this.gaussianSide = gSide;
    this.gaussianUp = gUp;
  }

  moveFocus(depth: number) {
    // this translates the gaussian curve to the side
    this.gaussianSide.setA(depth);
    this.gaussianUp.setA(depth);
  }

  changeRadius(radius: number) {
    // this makes the gaussian curve wider
    this.gaussianSide.setB(radius);
    this.gaussianUp.setB(radius);
  }
}

export function dof(depth: number, reps?: number) {
  return new DoFLoop(depth, reps);
}
