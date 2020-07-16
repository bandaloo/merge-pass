import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprFloat, PrimitiveVec2, tag } from "./expr";
import { pos } from "./normfragcoordexpr";

/** psuedorandom number expression */
export class RandomExpr extends ExprFloat {
  seed: Vec2;

  constructor(seed: Vec2 = pos()) {
    super(tag`random(${seed})`, ["uSeed"]);
    this.seed = seed;
    this.externalFuncs = [glslFuncs.random];
  }

  /** sets the seed (vary this over time to get a moving effect) */
  setSeed(seed: PrimitiveVec2) {
    this.setUniform("uSeed", seed);
    this.seed = seed;
  }
}

/**
 * creates expression that evaluates to a pseudorandom number between 0 and 1
 * @param seed vec2 to to seed the random number (defaults to the normalized
 * frag coord)
 */
export function random(seed: Vec2) {
  return new RandomExpr(seed);
}
