import { ExprVec4, tag } from "./expr";
import { Vec4 } from "../exprtypes";

// TODO the only reason this class exists is because `Operator<ExprVec4>` is not
// actually a subclass of ExprVec4, so it doesn't have `genPrograms`
export class SetColorExpr extends ExprVec4 {
  vec: Vec4;

  constructor(vec: Vec4) {
    super(tag`(${vec})`, ["uVal"]);
    this.vec = vec;
  }

  setVal(vec: Vec4) {
    this.setUniform("uVal", vec);
    this.vec = vec;
  }
}

export function setcolor(val: Vec4) {
  return new SetColorExpr(val);
}
