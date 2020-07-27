import { Float } from "../exprtypes";
import { EffectLoop, loop } from "../mergepass";
import { channel } from "./channelsampleexpr";
import { BasicFloat, float, mut, PrimitiveFloat, wrapInValue } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { op } from "./opexpr";

/** frame averaging motion blur loop */
export class MotionBlurLoop extends EffectLoop {
  persistence: Float;

  constructor(target = 0, persistence: Float = float(mut(0.3))) {
    const col1 = op(channel(target), "*", persistence);
    const col2 = op(fcolor(), "*", op(1, "-", persistence));
    const effects = [
      loop([op(col1, "+", col2)]).target(target),
      channel(target),
    ];
    super(effects, { num: 1 });
    this.persistence = persistence;
  }

  /** set the persistence (keep between 0 and 1) */
  setPersistence(float: PrimitiveFloat | number) {
    if (!(this.persistence instanceof BasicFloat))
      throw new Error("persistence expression not basic float");
    this.persistence.setVal(float);
  }
}

/**
 * creates a frame averaging motion blur effect
 * @param target the channel where your accumulation buffer is (defaults to 0,
 * which you might be using for something like the depth texture, so be sure to
 * change this to suit your needs)
 * @param persistence close to 0 is more ghostly, and close to 1 is nearly no
 * motion blur at all (defaults to 0.3)
 */
export function motionblur(target?: number, persistence?: Float | number) {
  return new MotionBlurLoop(target, wrapInValue(persistence));
}
