import { Float, RawFloat, RawVec } from "../exprtypes";
import { Operator } from "../operator";
import { tag, VecExpr } from "./expr";

export class ScaleExpr<T extends VecExpr> extends Operator<T> {
  constructor(scalar: Float, vec: T) {
    super(vec, tag`(${scalar} * ${vec})`, ["uScalar", "uVec"]);
  }

  setScalar(scalar: RawFloat) {
    this.setUniform("uScalar" + this.id, scalar);
  }

  setVector(scalar: RawVec) {
    this.setUniform("uVec" + this.id, scalar);
  }
}

export function scale<T extends VecExpr>(scalar: Float, vec: T) {
  return new ScaleExpr(scalar, vec);
}
