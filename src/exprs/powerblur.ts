import { EffectLoop } from "../mergepass";
import { gauss } from "./blurexpr";
import { pvec2 } from "./vecexprs";
import { mut } from "./expr";

const baseLog = (x: number, y: number) => Math.log(y) / Math.log(x);

// TODO consider getting rid of this, as it pretty much never looks good
/** power blur loop */
export class PowerBlurLoop extends EffectLoop {
  private size: number;

  constructor(size: number) {
    const side = gauss(mut(pvec2(size, 0)));
    const up = gauss(mut(pvec2(0, size)));
    const reps = Math.ceil(baseLog(2, size));
    super([side, up], {
      num: reps + 1,
    });
    this.size = size;
    this.loopInfo.func = (i) => {
      const distance = this.size / 2 ** i;
      up.setDirection(pvec2(0, distance));
      side.setDirection(pvec2(distance, 0));
    };
  }

  /** sets the size of the radius */
  setSize(size: number) {
    this.size = size;
    this.loopInfo.num = Math.ceil(baseLog(2, size));
  }
}

/**
 * fast approximate blur for large blur radius that might look good in some cases
 * @param size the radius of the blur
 */
export function pblur(size: number) {
  return new PowerBlurLoop(size);
}
