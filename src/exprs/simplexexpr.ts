import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprFloat, tag, PrimitiveVec2 } from "./expr";

/** simplex noise expression */
export class SimplexNoise extends ExprFloat {
  pos: Vec2;

  constructor(pos: Vec2) {
    super(tag`simplexnoise(${pos})`, ["uPos"]);
    this.pos = pos;
    this.externalFuncs = [glslFuncs.simplexhelpers, glslFuncs.simplexnoise];
  }

  setPos(pos: PrimitiveVec2) {
    this.setUniform("uPos", pos);
    this.pos = pos;
  }
}

/**
 * creates a simplex noise expression; values range from -1 to 1
 * @param pos position
 */
export function simplex(pos: Vec2) {
  return new SimplexNoise(pos);
}
