import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag, PrimitiveVec2 } from "./expr";

export class BlurExpr extends ExprVec4 {
  constructor(direction: Vec2) {
    super(tag`(gauss5(${direction}))`, ["uDirection"]);
    this.externalFuncs = [glslFuncs.gauss5];
    this.needs.neighborSample = true;
  }

  setDirection(direction: PrimitiveVec2) {
    this.setUniform("uDirection" + this.id, direction);
  }
}

export function gauss5(direction: Vec2) {
  return new BlurExpr(direction);
}
