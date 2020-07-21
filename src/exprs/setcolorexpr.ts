import { ExprVec4, tag, PrimitiveVec4 } from "./expr";
import { Vec4 } from "../exprtypes";

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

  /** sets the value which will be set to the color */
  /*
  setVal(vec: PrimitiveVec4) {
    this.setUniform("uVal", vec);
    this.vec = vec;
  }
  */
}
