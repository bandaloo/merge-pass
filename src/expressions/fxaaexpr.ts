import { ExprVec4, tag } from "./expr";
import { glslFuncs } from "../glslfunctions";

class FXAAExpr extends ExprVec4 {
  constructor() {
    super(tag`fxaa()`, []);
    this.externalFuncs = [glslFuncs.fxaa];
    this.needs.neighborSample = true;
  }
}

export function fxaa() {
  return new FXAAExpr();
}
