import { Float } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { n2e } from "./expr";
import { vec2 } from "./vecexprs";

export class Blur2dLoop extends EffectLoop {
  constructor(
    horizontalExpr: Float,
    verticalExpr: Float,
    reps: number = 2,
    taps?: 5 | 9 | 13
  ) {
    const side = gauss(vec2(horizontalExpr, 0), taps);
    const up = gauss(vec2(0, verticalExpr), taps);
    super([side, up], { num: reps });
  }
}

export function blur2d(
  horizontalExpr: Float | number,
  verticalExpr: Float | number,
  reps?: number,
  taps?: 5 | 9 | 13
) {
  return new Blur2dLoop(n2e(horizontalExpr), n2e(verticalExpr), reps, taps);
}
