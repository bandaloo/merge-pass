import { loop, EffectLoop } from "../mergepass";
import { setcolor } from "./setcolorexpr";
import { op } from "./opexpr";
import { channel } from "./channelsampleexpr";
import { fcolor } from "./fragcolorexpr";

export class MotionBlurLoop extends EffectLoop {
  constructor(target: number) {
    // TODO be able to change the divisor
    const effects = [
      loop([setcolor(op(op(channel(target), "+", fcolor()), "/", 2))]).target(
        target
      ),
      channel(target),
    ];
    super(effects, { num: 1 });
  }
}

export function motionblur(target: number) {
  return new MotionBlurLoop(target);
}
