import { Float } from "../exprtypes";
import { EffectLoop, loop } from "../mergepass";
import { a2 } from "./arity2";
import { gauss } from "./blurexpr";
import { brightness } from "./brightnessexpr";
import { channel } from "./channelsampleexpr";
import { contrast } from "./contrastexpr";
import {
  BasicFloat,
  cfloat,
  cvec4,
  float,
  mut,
  PrimitiveFloat,
  tag,
  wrapInValue,
} from "./expr";
import { fcolor } from "./fragcolorexpr";
import { op } from "./opexpr";
import { vec2 } from "./vecexprs";

// TODO bloom uses `input` so it has to be the first
// TODO maybe a way to update the scene buffer?

/** bloom loop */
export class BloomLoop extends EffectLoop {
  threshold: Float;
  horizontal: Float;
  vertical: Float;
  boost: Float;
  constructor(
    threshold: Float = float(mut(0.4)),
    horizontal: Float = float(mut(1)),
    vertical: Float = float(mut(1)),
    boost: Float = float(mut(1.3)),
    samplerNum: number = 1,
    taps: 5 | 9 | 13 = 9,
    reps = 3
  ) {
    const bright = cfloat(
      tag`((${channel(samplerNum)}.r + ${channel(samplerNum)}.g + ${channel(
        samplerNum
      )}.b) / 3.)`
    );
    const step = a2("step", bright, threshold);
    const col = cvec4(
      tag`vec4(${channel(samplerNum)}.rgb * (1. - ${step}), 1.)`
    );
    const list = [
      loop([col]).target(samplerNum),
      loop(
        [
          gauss(vec2(horizontal, 0), taps),
          gauss(vec2(0, vertical), taps),
          brightness(0.1),
          contrast(boost),
        ],
        reps
      ).target(samplerNum),
      op(fcolor(), "+", channel(samplerNum)),
    ];
    super(list, { num: 1 });
    this.threshold = threshold;
    this.horizontal = horizontal;
    this.vertical = vertical;
    this.boost = boost;
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

  /** set the treshold */
  setThreshold(num: PrimitiveFloat | number) {
    if (!(this.threshold instanceof BasicFloat))
      throw new Error("threshold expression not basic float");
    this.threshold.setVal(num);
  }

  /** set the contrast boost */
  setBoost(num: PrimitiveFloat | number) {
    if (!(this.boost instanceof BasicFloat))
      throw new Error("boost expression not basic float");
    this.boost.setVal(num);
  }
}

/**
 * creates a bloom loop
 * @param threshold values below this brightness don't get blurred (0.4 is
 * about reasonable, which is also the default)
 * @param horizontal how much to blur vertically (defaults to 1 pixel)
 * @param vertical how much to blur horizontally (defaults to 1 pixel)
 * @param taps how many taps for the blur (defaults to 9)
 * @param reps how many times to loop the blur (defaults to 3)
 */
export function bloom(
  threshold?: Float | number,
  horizontal?: Float | number,
  vertical?: Float | number,
  boost?: Float | number,
  samplerNum?: number,
  taps?: 5 | 9 | 13,
  reps?: number
) {
  return new BloomLoop(
    wrapInValue(threshold),
    wrapInValue(horizontal),
    wrapInValue(vertical),
    wrapInValue(boost),
    samplerNum,
    taps,
    reps
  );
}
