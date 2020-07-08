import { ExprFloat, tag } from "./expr";
import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";

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
