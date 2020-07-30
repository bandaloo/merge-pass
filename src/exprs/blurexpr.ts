import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, PrimitiveVec2, SourceLists } from "./expr";

/** @ignore */
function genBlurSource(direction: Vec2, taps: 5 | 9 | 13): SourceLists {
  return {
    sections: [`gauss${taps}(`, ")"],
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
    super(genBlurSource(direction, taps), ["uDirection"]);
    this.direction = direction;
    this.externalFuncs = [tapsToFuncSource(taps)];
    this.brandExprWithChannel(0, samplerNum);
  }

  /** set the blur direction (keep magnitude no greater than 1 for best effect) */
  setDirection(direction: PrimitiveVec2) {
    this.setUniform("uDirection" + this.id, direction);
    this.direction = direction;
  }
}

/**
 * creates expression that performs one pass of a gaussian blur
 * @param direction direction to blur (keep magnitude less than or equal to 1
 * for best effect)
 * @param taps number of taps (defaults to 5)
 * @param samplerNum which channel to sample from (default 0)
 */
export function gauss(
  direction: Vec2,
  taps: 5 | 9 | 13 = 5,
  samplerNum?: number
) {
  return new BlurExpr(direction, taps, samplerNum);
}
