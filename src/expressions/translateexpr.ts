import { Vec2 } from "../exprtypes";
import { tag, ExprVec2 } from "./expr";

// really just adding two vecs together, but it might be confusing that there's
// rotate but no translate, so this is included. also it could make some
// operations more readable
export class TranslateExpr extends ExprVec2 {
  vec: Vec2;
  pos: Vec2;

  constructor(vec: Vec2, pos: Vec2) {
    super(tag`(${vec} + ${pos})`, ["uVec", "uPos"]);
    this.vec = vec;
    this.pos = pos;
  }

  setVec(vec: Vec2) {
    this.setUniform("uVec" + this.id, vec);
    this.vec = vec;
  }

  setPos(pos: Vec2) {
    this.setUniform("uPos" + this.id, pos);
    this.pos = pos;
  }
}

export function translate(vec: Vec2, pos: Vec2) {
  return new TranslateExpr(vec, pos);
}
