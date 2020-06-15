import { EffectLoop } from "../mergepass";
import { gauss5 } from "./blurexpr";
import { vec2 } from "./vecexprs";
import { Float } from "../exprtypes";

export class Blur2dLoop extends EffectLoop {
  constructor(horizontalExpr: Float, verticalExpr: Float, reps: number = 2) {
    const side = gauss5(vec2(horizontalExpr, 0));
    const up = gauss5(vec2(0, verticalExpr));
    super([side, up], { num: reps });
  }
}

export function blur2d(
  horizontalExpr: Float,
  verticalExpr: Float,
  reps?: number
) {
  return new Blur2dLoop(horizontalExpr, verticalExpr, reps);
}
