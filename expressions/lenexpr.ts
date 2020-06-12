import { Vec } from "../exprtypes";
import { ExprFloat, tag } from "./expr";

export class LenExpr extends ExprFloat {
  vec: Vec;

  constructor(vec: Vec) {
    super(tag`(length(${vec}))`, ["uVec"]);
    this.vec = vec;
  }
}
