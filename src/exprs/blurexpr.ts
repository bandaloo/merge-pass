import { Vec2 } from "../exprtypes";
import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, SourceLists } from "./expr";

/** @ignore */
function genBlurSource(
  direction: Vec2,
  taps: 5 | 9 | 13,
  buffer?: number
): SourceLists {
  return {
    sections: [`gauss${taps}${buffer === undefined ? "" : "_" + buffer}(`, ")"],
    values: [direction],
  };
}

/** @ignore */
function tapsToFuncSource(taps: 5 | 9 | 13) {
  switch (taps) {
    case 5:
      return glslFuncs.gauss5;
    case 9:
      return glslFuncs.gauss9;
    case 13:
      return glslFuncs.gauss13;
  }
}

/** gaussian blur expression */
export class BlurExpr extends ExprVec4 {
  direction: Vec2;

  constructor(direction: Vec2, taps: 5 | 9 | 13 = 5, samplerNum?: number) {
    // this is already guaranteed by typescript, but creates helpful error for
    // use in gibber or anyone just using javascript
    if (![5, 9, 13].includes(taps)) {
      throw new Error("taps for gauss blur can only be 5, 9 or 13");
    }
    super(genBlurSource(direction, taps, samplerNum), ["uDirection"]);
    this.direction = direction;
    if (samplerNum === undefined) {
      this.needs.neighborSample = true;
      this.externalFuncs = [tapsToFuncSource(taps)];
    } else {
      this.needs.extraBuffers = new Set([samplerNum]);
      console.log("taps", taps);
      console.log("samplerNum", samplerNum);
      this.externalFuncs = [
        replaceSampler(
          tapsToFuncSource(taps),
          /vec4\sgauss[0-9]+/g,
          samplerNum
        ),
      ];
    }
  }

  /** set the blur direction (keep magnitude no greater than 1 for best effect) */
  setDirection(direction: Vec2) {
    this.setUniform("uDirection" + this.id, direction);
    this.direction = direction;
  }
}

/**
 * creates expression that performs one pass of a gaussian blur
 * @param direction direction to blur (keep magnitude no greater than 1 for
 * best effect)
 * @param taps number of taps (defaults to 5)
 * @param samplerNum which channel to sample from (defaut 0)
 */
export function gauss(
  direction: Vec2,
  taps: 5 | 9 | 13 = 5,
  samplerNum?: number
) {
  return new BlurExpr(direction, taps, samplerNum);
}
