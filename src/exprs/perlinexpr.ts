import { Float, Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprFloat, pfloat, tag } from "./expr";
import { op } from "./opexpr";

export class PerlinExpr extends ExprFloat {
  pos: Vec2;

  constructor(pos: Vec2) {
    super(tag`gradientnoise(${pos})`, ["uPos"]);
    this.pos = pos;
    this.externalFuncs = [glslFuncs.random2, glslFuncs.gradientnoise];
  }

  setPos(pos: Vec2) {
    this.setUniform("uPos", pos);
    this.pos = pos;
  }
}

export function perlin(pos: Vec2) {
  return new PerlinExpr(pos);
}

export function fractalperlin(pos: Vec2, octaves: number) {
  if (octaves < 0) throw new Error("octaves can't be < 0");
  const recurse = (pos: Vec2, size: number, level: number): Float => {
    if (level <= 0) return pfloat(0);
    return op(
      perlin(op(pos, "/", size * 2)),
      "+",
      recurse(pos, size / 2, level - 1)
    );
  };
  return recurse(pos, 0.5, octaves);
}
