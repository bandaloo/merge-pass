import { Float, Vec4 } from "../exprtypes";
import { FragColorExpr } from "./fragcolorexpr";
import { ExprVec4, tag, n2p, PrimitiveFloat, n2e } from "./expr";
import { glslFuncs } from "../glslfunctions";

export class Contrast extends ExprVec4 {
  constructor(val: Float, col: Vec4 = new FragColorExpr()) {
    super(tag`contrast(${val}, ${col})`, ["uVal", "uCol"]);
    this.externalFuncs = [glslFuncs.contrast];
  }

  setContrast(contrast: PrimitiveFloat) {
    this.setUniform("uContrast" + this.id, n2p(contrast));
  }
}

export function contrast(val: Float | number, col?: Vec4) {
  return new Contrast(n2e(val), col);
}
