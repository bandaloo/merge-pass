import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag } from "./expr";

export class BlurExpr extends ExprVec4 {
  constructor(direction: Vec2) {
    super(tag`(gauss5(${direction}))`, ["uDirection"]);
    this.externalFuncs = [glslFuncs.gauss5];
  }
}
