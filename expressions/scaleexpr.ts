import { Float, RawFloat, RawUniformVal } from "../exprtypes";
import { tag, VecExpr, Expr } from "./expr";
import { Operator } from "../operator";

export class ScaleExpr<T extends VecExpr> extends Operator<T> {
  constructor(scalar: Float, vec: T) {
    super(vec, tag`(${scalar} * ${vec})`, ["uScalar", "uVec"]);
  }

  setScalar(scalar: RawFloat) {
    this.setUniform("uScalar" + this.id, scalar);
  }
}

export function scale<T extends VecExpr>(scalar: Float, vec: T) {
  return new ScaleExpr(scalar, vec);
}
