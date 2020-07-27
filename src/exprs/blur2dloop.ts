import { Float } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { BasicFloat, float, mut, PrimitiveFloat, wrapInValue } from "./expr";
import { vec2 } from "./vecexprs";

/** 2D blur loop */
export class Blur2dLoop extends EffectLoop {
  horizontal: Float;
  vertical: Float;

  constructor(
    horizontal: Float = float(mut(1)),
    vertical: Float = float(mut(1)),
    reps: number = 2,
    taps?: 5 | 9 | 13,
    samplerNum?: number
  ) {
    const side = gauss(vec2(horizontal, 0), taps, samplerNum);
    const up = gauss(vec2(0, vertical), taps, samplerNum);
    super([side, up], { num: reps });
    this.horizontal = horizontal;
    this.vertical = vertical;
  }

  /**
   * set the horizontal stretch of the blur effect (no greater than 1 for best
   * effect)
   */
  setHorizontal(num: PrimitiveFloat | number) {
    if (!(this.horizontal instanceof BasicFloat))
      throw new Error("horizontal expression not basic float");
    this.horizontal.setVal(num);
  }

  /**
   * set the vertical stretch of the blur effect (no greater than 1 for best
   * effect)
   */
  setVertical(num: PrimitiveFloat | number) {
    if (!(this.vertical instanceof BasicFloat))
      throw new Error("vertical expression not basic float");
    this.vertical.setVal(num);
  }
}

/**
 * creates a loop that runs a horizontal, then vertical gaussian blur (anything
 * more than 1 pixel in the horizontal or vertical direction will create a
 * ghosting effect, which is usually not desirable)
 * @param horizontalExpr float for the horizontal blur (1 pixel default)
 * @param verticalExpr float for the vertical blur (1 pixel default)
 * @param reps how many passes (defaults to 2)
 * @param taps how many taps (defaults to 5)
 * @param samplerNum change if you want to sample from a different channel and
 * the outer loop has a different target
 */
export function blur2d(
  horizontalExpr?: Float | number,
  verticalExpr?: Float | number,
  reps?: number,
  taps?: 5 | 9 | 13,
  samplerNum?: number
) {
  return new Blur2dLoop(
    wrapInValue(horizontalExpr),
    wrapInValue(verticalExpr),
    reps,
    taps,
    samplerNum
  );
}
