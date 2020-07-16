import { Float, Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprFloat, pfloat, tag, PrimitiveVec2 } from "./expr";
import { op } from "./opexpr";

/** Perlin noise expression */
export class PerlinExpr extends ExprFloat {
  pos: Vec2;

  // TODO include a default
  constructor(pos: Vec2) {
    super(tag`gradientnoise(${pos})`, ["uPos"]);
    this.pos = pos;
    this.externalFuncs = [glslFuncs.random2, glslFuncs.gradientnoise];
  }

  /** sets the position to calculate noise value of */
  setPos(pos: PrimitiveVec2) {
    this.setUniform("uPos", pos);
    this.pos = pos;
  }
}

/**
 * creates a perlin noise expression; values range from -1 to 1 but they tend
 * to be grayer than the [[simplex]] implementation
 * @param pos position
 */
export function perlin(pos: Vec2) {
  return new PerlinExpr(pos);
}

/**
 * take any function from a position to a float, and repeatedly sum calls to it
 * with doubling frequency and halving amplitude (works well with [[simplex]]
 * and [[perlin]])
 * @param pos position
 * @param octaves how many layers deep to make the fractal
 * @param func the function to fractalize
 */
export function fractalize(
  pos: Vec2,
  octaves: number,
  func: (pos: Vec2) => ExprFloat
) {
  if (octaves < 0) throw new Error("octaves can't be < 0");
  const recurse = (pos: Vec2, size: number, level: number): Float => {
    if (level <= 0) return pfloat(0);
    return op(
      func(op(pos, "/", size * 2)),
      "+",
      recurse(pos, size / 2, level - 1)
    );
  };
  return recurse(pos, 0.5, octaves);
}
