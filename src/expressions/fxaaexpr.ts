import { ExprVec4, tag } from "./expr";
import { glslFuncs } from "../glslfunctions";

/** FXAA expression */
class FXAAExpr extends ExprVec4 {
  constructor() {
    super(tag`fxaa()`, []);
    this.externalFuncs = [glslFuncs.fxaa];
    this.needs.neighborSample = true;
  }
}

/** FXAA antaliasing expression */
export function fxaa() {
  return new FXAAExpr();
}
