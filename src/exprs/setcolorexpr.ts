import { Vec4 } from "../exprtypes";
import { ExprVec4, tag } from "./expr";

/**
 * set fragment color expression (not needed for the user; used internally for
 * wrapping any kind of [[Vec4]] in an [[ExprVec4]])
 */
export class SetColorExpr extends ExprVec4 {
  vec: Vec4;

  constructor(vec: Vec4) {
    super(tag`(${vec})`, ["uVal"]);
    this.vec = vec;
  }

  /*
  getSampleNum() {
    if (this.vec instanceof ExprVec4) {
      this.vec.getSampleNum();
    }
    return 0;
  }
  */

  /** sets the value which will be set to the color */
  /*
  setVal(vec: PrimitiveVec4) {
    this.setUniform("uVal", vec);
    this.vec = vec;
  }
  */
}
