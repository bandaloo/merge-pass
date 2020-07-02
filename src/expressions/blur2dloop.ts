import { Float } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { n2e, BasicFloat, PrimitiveFloat, mut, float } from "./expr";
import { vec2 } from "./vecexprs";

export class Blur2dLoop extends EffectLoop {
  horizontal: Float;
  vertical: Float;

  constructor(
    horizontal: Float = float(mut(1)),
    vertical: Float = float(mut(1)),
    reps: number = 2,
    taps?: 5 | 9 | 13
  ) {
    const side = gauss(vec2(horizontal, 0), taps);
    const up = gauss(vec2(0, vertical), taps);
    super([side, up], { num: reps });
    this.horizontal = horizontal;
    this.vertical = vertical;
  }

  setHorizontal(float: PrimitiveFloat) {
    if (!(this.horizontal instanceof BasicFloat))
      throw new Error("horizontal expression not basic float");
    this.horizontal.setVal(float);
  }

  setVertical(float: PrimitiveFloat) {
    if (!(this.vertical instanceof BasicFloat))
      throw new Error("vertical expression not basic float");
    this.vertical.setVal(float);
  }
}

export function blur2d(
  horizontalExpr?: Float | number,
  verticalExpr?: Float | number,
  reps?: number,
  taps?: 5 | 9 | 13
) {
  return new Blur2dLoop(n2e(horizontalExpr), n2e(verticalExpr), reps, taps);
}
