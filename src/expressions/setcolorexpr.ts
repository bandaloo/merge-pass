import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";
export class SetColorExpr extends ExprVec4 {
  constructor(val: Vec4) {
    super(tag`(${val})`, ["uVal"]);
  }

  setVal(val: Vec4) {
    this.setUniform("uVal", val);
  }
}

export function setcolor(val: Vec4) {
  return new SetColorExpr(val);
}
