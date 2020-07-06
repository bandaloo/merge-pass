import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag } from "./expr";
import { Vec2 } from "../exprtypes";
import { nfcoord } from "./normfragcoordexpr";

export class RandomExpr extends ExprVec4 {
  seed: Vec2;

  constructor(seed: Vec2 = nfcoord()) {
    super(tag`random(${seed})`, ["uSeed"]);
    this.seed = seed;
    this.externalFuncs = [glslFuncs.random];
  }

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
