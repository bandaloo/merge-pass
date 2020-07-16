import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { tag, ExprFloat } from "./expr";
import { pos } from "./normfragcoordexpr";

export class RandomExpr extends ExprFloat {
  seed: Vec2;

  constructor(seed: Vec2 = pos()) {
    super(tag`random(${seed})`, ["uSeed"]);
    this.seed = seed;
    this.externalFuncs = [glslFuncs.random];
  }

  /** sets the seed (vary this over time to get a moving effect) */
  setSeed(seed: Vec2) {
    this.setUniform("uSeed", seed);
    this.seed = seed;
  }
}

/**
 * creates expression that evaluates to a pseudorandom number
 * @param seed vec2 to to seed the random number (defaults to the normalized frag coord)
 */
export function random(seed: Vec2) {
  return new RandomExpr(seed);
}
